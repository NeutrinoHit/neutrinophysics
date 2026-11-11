"""The Earth with a cut through the detector: setup pictures for the geoneutrino and atmospheric examples.

The globe is ray-traced (orthographic camera) with the NASA Blue Marble surface map; the half of the
Earth in front of one plane through the detector and the centre is removed, so every distance drawn
in that plane is a true chord. Layer radii are to scale (R = 6371 km); interior colours are schematic.

- geo:  continental crust 35 km and the mantle hold U and Th, the core none (as in the scales applet);
        one source at distance L and the sphere of radius L around the detector.
- atm:  mantle, outer core 3480 km, inner core 1221.5 km (PREM, Dziewonski & Anderson 1981), the globe alone;
        the atmospheric applet draws the detector, the zenith angle and the path L(theta_z) over it, using
        the projection written to ../widgets/earth_cut_atm.js.

Input: the NASA Blue Marble Next Generation base map (July 2004, 5400 x 2700, equirectangular),
https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/ (not stored here).

Run:  python earth_cutaway.py <blue marble jpg> [geo|atm ...]
Output: ../../media/figures/earth-cut-<name>.png (and ../widgets/earth_cut_atm.js)
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "media" / "figures"

R_KM = 6371.0
R_CRUST_GEO = (R_KM - 35.0) / R_KM          # continental crust 35 km (scales applet)
R_CMB = 3480.0 / R_KM                       # PREM core-mantle boundary
R_ICB = 1221.5 / R_KM                       # PREM inner-core boundary

FG, MUTED = "#eef3f7", "#a9b6c2"
BLUE, GOLD, ORANGE, GREEN = "#73c7ff", "#ffd166", "#ff8a5c", "#7ee2ae"

# Camera: yaw and pitch of the viewing direction relative to the normal of the cut plane.
YAW_DEG, PITCH_DEG = 50.0, 28.0
# The detector: a point in southern China (illustrative, not a site position); ALPHA turns the cut plane
# about the local vertical (0: the plane contains the local east-west line).
SITE_LAT, SITE_LON, ALPHA_DEG = 22.0, 113.0, 120.0


def unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def camera():
    yaw, pitch = np.radians([YAW_DEG, PITCH_DEG])
    c = unit([np.sin(yaw) * np.cos(pitch), np.sin(pitch), np.cos(yaw) * np.cos(pitch)])   # towards the camera
    r = unit(np.cross([0.0, 1.0, 0.0], c))
    w = np.cross(c, r)
    return r, w, c


def geo_frame():
    """World axes (x: in-plane horizontal, y: up at the detector, z: normal to the cut) in Earth-fixed axes."""
    lat, lon, a = np.radians([SITE_LAT, SITE_LON, ALPHA_DEG])
    up = np.array([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)])
    east = np.array([-np.sin(lon), np.cos(lon), 0.0])
    north = np.cross(up, east)
    x = np.cos(a) * east + np.sin(a) * north
    z = np.cross(x, up)
    return x, up, z


def render(texture: np.ndarray, layers, size: int, span: float):
    """RGBA image; layers: list of (outer radius, rgb) from the surface inwards."""
    r, w, c = camera()
    n = np.array([0.0, 0.0, 1.0])                 # the removed half: z > 0
    s = (np.arange(size) - (size - 1) / 2) / ((size - 1) / 2) * span
    sx, sy = np.meshgrid(s, -s)
    rr = sx * sx + sy * sy
    inside = rr <= 1.0
    q = np.sqrt(np.clip(1.0 - rr, 0.0, None))
    front = sx[..., None] * r + sy[..., None] * w + q[..., None] * c
    kept_surface = inside & (front @ n <= 0)
    zc = -(sx * (r @ n) + sy * (w @ n)) / (c @ n)          # depth of the cut plane along the ray
    face = inside & ~kept_surface & (rr + zc * zc <= 1.0)
    pf = sx[..., None] * r + sy[..., None] * w + zc[..., None] * c
    light = unit(0.75 * c + 0.45 * w + 0.45 * r)
    rgba = np.zeros((size, size, 4))

    # surface from the map
    gx, gy, gz = geo_frame()
    g = front[..., :1] * gx + front[..., 1:2] * gy + front[..., 2:3] * gz
    lon = np.arctan2(g[..., 1], g[..., 0])
    lat = np.arcsin(np.clip(g[..., 2], -1, 1))
    H, W = texture.shape[:2]
    u = (lon / (2 * np.pi) + 0.5) * (W - 1)
    v = (0.5 - lat / np.pi) * (H - 1)
    col = np.stack([map_coordinates(texture[..., k], [v, u], order=1, mode="nearest") for k in range(3)], -1) / 255
    shade = 0.42 + 0.75 * np.clip(front @ light, 0, None)
    rim = (1 - q) ** 2 * 0.35
    surf = np.clip(col * shade[..., None], 0, 1) * (1 - rim[..., None]) + np.array([0.36, 0.66, 0.92]) * rim[..., None]
    rgba[kept_surface, :3] = surf[kept_surface]
    rgba[kept_surface, 3] = 1

    # the cut face
    rad = np.linalg.norm(pf, axis=-1)
    fcol = np.zeros(rad.shape + (3,))
    for edge, rgb in layers:
        fcol[rad <= edge] = rgb
    rng = np.random.default_rng(20261110)
    grain = 1 + 0.035 * rng.normal(size=rad.shape)
    fshade = 0.80 + 0.40 * max(0.0, float(n @ light))
    fcol = np.clip(fcol * grain[..., None] * fshade, 0, 1)
    for edge, _ in layers:
        line = face & (np.abs(rad - edge) < 0.9 * span / size)
        fcol[line] = 0.6 * fcol[line] + 0.4
    rgba[face, :3] = fcol[face]
    rgba[face, 3] = 1

    # atmosphere glow around the kept limb
    dist = np.sqrt(rr)
    limb = np.stack([sx, sy], -1) / np.maximum(dist, 1e-9)[..., None]
    limb3 = limb[..., :1] * r + limb[..., 1:] * w
    glow = np.exp(-((dist - 1) / 0.022) ** 2) * (limb3 @ n <= 0.02) * (~inside)
    rgba[~inside, :3] = np.array([0.36, 0.66, 0.92])
    rgba[~inside, 3] = 0.75 * glow[~inside]
    return rgba, (r, w)


def project(points, basis):
    r, w = basis
    p = np.atleast_2d(points)
    return p @ r, p @ w


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255


def figure(name, texture, plt):
    span = 1.32
    if name == "geo":
        layers = [(1.0, hexrgb(GREEN) * 0.95), (R_CRUST_GEO, hexrgb("#b0623f")),
                  (R_CMB, hexrgb("#6b6f78")), (R_ICB, hexrgb("#8a8f99"))]
    else:
        layers = [(1.0, hexrgb("#9d6540")), (R_CMB, hexrgb("#d99044")), (R_ICB, hexrgb("#f8d080"))]
    size = 1500 if name == "geo" else 1000
    img, basis = render(texture, layers, size, span)
    if name == "atm":
        save_base(img, basis, size, span, name)
        return

    fig = plt.figure(figsize=(5, 5), dpi=300)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(-span, span)
    ax.set_ylim(-span, span)
    ax.axis("off")
    ax.imshow(img, extent=[-span, span, -span, span], interpolation="lanczos", zorder=1)

    def pt(p):
        x, y = project(p, basis)
        return float(x[0]), float(y[0])

    def label(s, xy, color=FG, size=15, **kw):
        ax.text(*xy, s, color=color, fontsize=size, zorder=6, **kw)

    D = np.array([0.0, 1.0, 0.0])
    xd, yd = pt(D)
    if name == "geo":
        S = np.array([0.50, 0.30, 0.0])
        Lr = np.linalg.norm(S - D)
        # the sphere of radius L around the detector, in the cut plane, inside the Earth
        t = np.linspace(0, 2 * np.pi, 720)
        ring = D + Lr * np.stack([np.cos(t), np.sin(t), 0 * t], -1)
        ring = ring[np.linalg.norm(ring, axis=1) <= 1.0]
        ring = ring[np.argsort(np.arctan2(ring[:, 1] - 1, ring[:, 0]))]
        x, y = project(ring, basis)
        ax.plot(x, y, color=BLUE, lw=1.8, ls=(0, (4, 3)), zorder=4)
        xs, ys = pt(S)
        ax.plot([xd, xs], [yd, ys], color=FG, lw=2.2, zorder=5)
        ax.plot(xs, ys, "o", ms=7, color=GOLD, mec="#000000", mew=0.8, zorder=6)
        mx, my = pt(0.5 * (S + D))
        label(r"$L$", (mx + 0.05, my + 0.02), size=19)
        label("source", (xs + 0.05, ys - 0.11), color=GOLD, size=13)
        xc, yc = pt(np.array([-0.30, 0.62, 0]))
        label("closer\nthan $L$", (xc, yc), color=BLUE, size=13, ha="center", va="center")
        cx, cy = pt(np.array([0.05, -0.28, 0]))
        label("core:\nno U, Th", (cx, cy), color=FG, size=13, ha="center", va="center")
        mxm, mym = pt(np.array([-0.30, -0.80, 0]))
        label("mantle:\nU, Th", (mxm, mym), color=FG, size=13, ha="center", va="center")
        kx, ky = pt(np.array([-0.995, 0.10, 0]))
        label("crust\n35 km:\nU, Th", (kx - 0.13, ky), color=GREEN, size=13, ha="right", va="center")
        ax.annotate("", xy=(kx, ky), xytext=(kx - 0.11, ky), zorder=6,
                    arrowprops=dict(arrowstyle="-", color=GREEN, lw=1.2))
    ax.plot(xd, yd, "s", ms=8, color=FG, mec="#000000", mew=1.0, zorder=7)
    label("detector", (xd - 0.04, yd + 0.07), color=FG, size=13, ha="right")
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"earth-cut-{name}.png"
    fig.savefig(out, transparent=True, dpi=180)
    plt.close(fig)
    im = Image.open(out)                         # crop the empty margins
    x0, y0, x1, y1 = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    pad = 6
    im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))).save(out)
    print("wrote", out)


def save_base(img, basis, size, span, name):
    """The globe alone and its projection, for an overlay drawn in the browser (assets/widgets/earth_cut_<name>.js)."""
    import json
    k = (size - 1) / (2 * span)                  # pixels per Earth radius
    c = (size - 1) / 2                           # pixel of the centre
    alpha = img[..., 3] > 0.03
    ys, xs = np.nonzero(alpha)
    x0, x1 = xs.min() - 6, xs.max() + 6
    y0, y1 = int(c - 1.32 * k), ys.max() + 6   # room above the detector for the zenith
    out = OUT / f"earth-cut-{name}.png"
    Image.fromarray((np.clip(img, 0, 1) * 255).astype("uint8"), "RGBA").crop((x0, y0, x1 + 1, y1 + 1)).save(out)
    r, w = basis
    meta = {"width": int(x1 - x0 + 1), "height": int(y1 - y0 + 1), "cx": float(c - x0), "cy": float(c - y0), "k": float(k),
            # screen coordinates of the in-plane unit vectors x (horizontal) and y (up at the detector)
            "ex": [float(r[0]), float(w[0])], "ey": [float(r[1]), float(w[1])]}
    js = HERE.parent / "widgets" / f"earth_cut_{name}.js"
    js.write_text("// generated by ../oscillations/earth_cutaway.py: the cut Earth picture and its projection\n"
                  f"window.EARTH_CUT_{name.upper()} = {json.dumps(meta)};\n")
    print("wrote", out, js)


def main(argv):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"mathtext.fontset": "stix", "font.family": "sans-serif"})
    texture = np.asarray(Image.open(argv[0]).convert("RGB")).astype(float)
    for name in argv[1:] or ["geo", "atm"]:
        figure(name, texture, plt)


if __name__ == "__main__":
    main(sys.argv[1:])
