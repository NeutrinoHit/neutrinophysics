"""Schematic figures for lecture 11.

layer-phasor: a thin layer adds i*dphi to the incident amplitude; the small
arrow is perpendicular, so the sum is the incident arrow turned by dphi.
plate-experiment: a plate with axes at 45 deg between crossed polarizers;
output polarization and brightness for dphi = 0 ... 2 pi.
phase-depth: phase against depth; jumps at the layers, mean slope n k.
state-plane: a state as an arrow in the (nu_e, nu_x) plane with its coordinates psi_e, psi_x and the
vacuum mass axes turned by theta.
anisotropy-arrows: each anisotropy (axis, k difference) as an arrow of length k_1-k_2 and direction twice the axis
angle; vacuum + matter = matter eigen-axes. Solar core numbers (A=2.05, theta=33.7 deg, theta_m=75.5 deg).
fresnel-rings: the layer z=0 with rings of equal path r=z+m*lambda/2 to the point P, seen in
perspective; the wavelength is enlarged so that b is not small against L (nothing needs b<<L).
eigen-axes: flavour axes e, x, the vacuum mass axes nu_1, nu_2 (angle theta)
and the matter mass states nu_mat,1, nu_mat,2 (angle theta_m, dense matter as in the solar
core, so nu_mat,2 is close to nu_e):
nu_e = cos t_m nu_mat,1 + sin t_m nu_mat,2.
Corrections and angles are drawn for legibility; the figures are schemes.
"""
from pathlib import Path
import tomllib
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Arc, Circle, FancyArrowPatch

HERE=Path(__file__).resolve().parent
S=tomllib.loads((HERE/'config.toml').read_text())['figure']
INC,SEC,TOT,TXT,MUT=S['incident'],S['secondary'],S['total'],S['text'],S['muted']
VIO='#b8a2ff';GRID='#4e606d'


def style():
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':20,'text.color':TXT,
        'axes.labelcolor':TXT,'svg.fonttype':'path','mathtext.fontset':'dejavusans',
        'savefig.facecolor':S['background'],'figure.facecolor':S['background']})


def arrow(ax,p0,p1,color,lw=4,ms=22,style='-|>',**kw):
    ax.annotate('',p1,p0,arrowprops={'arrowstyle':style,'lw':lw,'color':color,'shrinkA':0,'shrinkB':0,
                                      'mutation_scale':ms,**kw})


def save(fig,name):
    fig.savefig(HERE/f'{name}.svg',metadata={'Creator':'DN'})
    fig.savefig(HERE/f'{name}.png',dpi=S['dpi'],metadata={'Software':'NeutrinoHit'})
    plt.close(fig)


def layer_phasor():
    L,h=1.5,.45;delta=np.arctan2(h,L)
    fig=plt.figure(figsize=(8.6,4.6));ax=fig.add_axes([0,0,1,1]);ax.set(xlim=(-.25,2.45),ylim=(-.55,.78),aspect='equal');ax.axis('off')
    arrow(ax,(0,0),(L,0),INC)
    arrow(ax,(L,0),(L,h),SEC)
    arrow(ax,(0,0),(L,h),TOT,lw=4.5)
    ax.plot([L,L-.07,L-.07],[.07,.07,0],color=MUT,lw=1.5)
    ax.add_patch(Arc((0,0),2.0,2.0,theta1=0,theta2=np.degrees(delta),color=MUT,lw=2))
    ax.text(1.05,.065,'dφ',fontsize=24,color=TXT,va='bottom')
    ax.text(L/2,-.09,'волна до слоя',color=INC,fontsize=23,ha='center',va='top')
    ax.text(L+.07,h/2+.02,'вклад слоя',color=SEC,fontsize=23,va='center')
    ax.text(L+.07,h/2-.11,'множитель $i$: 90°',color=SEC,fontsize=19,va='center')
    ax.text(L/2-.05,h/2+.11,'волна за слоем',color=TOT,fontsize=22,ha='center',va='bottom',rotation=np.degrees(delta))
    ax.text(1.2,-.45,'Стрелка — амплитуда и фаза колебания.\nВклад слоя нарисован увеличенным.',color=MUT,fontsize=16,ha='center',va='center')
    save(fig,'layer-phasor')


def disk(ax,c,r=1.0):
    ax.add_patch(Circle(c,r,fill=False,color=GRID,lw=2))


def plate_experiment():
    """Plate with axes at 45 deg between crossed polarizers (H in, V out).
    In the H/V basis the output is ((1+e^{i dphi})/2, (1-e^{i dphi})/2)."""
    fig=plt.figure(figsize=(15.5,6.4));ax=fig.add_axes([0,0,1,1])
    ax.set(xlim=(0,15.5),ylim=(0,6.4),aspect='equal');ax.axis('off')
    # set-up strip
    y0=5.25;r=.55;xs=[1.3,4.3,7.3,10.3]
    for x in xs[:3]:disk(ax,(x,y0),r)
    arrow(ax,(xs[0]-.45,y0),(xs[0]+.45,y0),INC,lw=3,ms=16,style='<|-|>')
    d=.42/np.sqrt(2)
    ax.plot([xs[1]-d,xs[1]+d],[y0-d,y0+d],color=TOT,lw=2.4);ax.plot([xs[1]-d,xs[1]+d],[y0+d,y0-d],color=SEC,lw=2.4)
    arrow(ax,(xs[2],y0-.45),(xs[2],y0+.45),VIO,lw=3,ms=16,style='<|-|>')
    ax.add_patch(plt.Rectangle((xs[3]-.45,y0-.45),.9,.9,facecolor='#d9d9d9',edgecolor=GRID,lw=1.5))
    for i in range(3):arrow(ax,(xs[i]+.75,y0),(xs[i+1]-.75,y0),MUT,lw=2,ms=14)
    for x,lab in zip(xs,['поляризатор H','пластинка, оси 45°','анализатор V','экран']):
        ax.text(x,y0+.72,lab,ha='center',fontsize=18)
    ax.text(12.0,y0+.05,'яркость $=\\sin^2\\frac{\\Delta\\varphi}{2}$',fontsize=21,va='center')
    # five thicknesses
    phis=[0,np.pi/2,np.pi,3*np.pi/2,2*np.pi];labels=['0','π/2','π','3π/2','2π']
    words=['темно','половина','светло','половина','темно']
    t=np.linspace(0,2*np.pi,300)
    for j,(phi,lab,w) in enumerate(zip(phis,labels,words)):
        cx=1.55+3.1*j;cy=2.55;R=.8
        disk(ax,(cx,cy),R)
        ex=(1+np.exp(1j*phi))/2;ey=(1-np.exp(1j*phi))/2
        x=(ex*np.exp(-1j*t)).real;y=(ey*np.exp(-1j*t)).real
        ax.plot(cx+.72*x,cy+.72*y,color=TOT,lw=3.2)
        ax.text(cx,cy+1.05,'Δφ = '+lab,ha='center',fontsize=21)
        b=np.sin(phi/2)**2;g=0.08+0.84*b
        ax.add_patch(plt.Rectangle((cx-.45,.45),.9,.6,facecolor=(g,g,g),edgecolor=GRID,lw=1.5))
        ax.text(cx,.18,w,ha='center',va='center',fontsize=17,color=MUT)
    ax.text(.15,2.55,'на выходе\nиз пластинки',fontsize=15,color=MUT,va='center',ha='left',rotation=90)
    ax.text(15.35,4.2,'толщина L растёт →',fontsize=17,color=MUT,ha='right')
    save(fig,'plate-experiment')


def phase_depth():
    fig=plt.figure(figsize=(7.4,5.0));ax=fig.add_axes([.12,.14,.84,.8]);ax.set_facecolor(S['background'])
    a=1.0;kd=1.0;d=.5;M=6
    z=np.linspace(0,M*a,500)
    ax.plot(z,kd*z,color=INC,lw=3,ls=(0,(6,4)))
    zs=[0];ps=[0];acc=0
    for j in range(M):
        zc=(j+.5)*a;zs+=[zc,zc,(j+1)*a];ps+=[acc+kd/2,acc+kd/2+d,acc+kd+d];acc+=kd+d
    ax.plot(zs,ps,color=TOT,lw=1.6,alpha=.7)
    ax.plot(z,(kd+d)*z,color=TOT,lw=3.6)
    for e in ['top','right']:ax.spines[e].set_visible(False)
    for e in ['left','bottom']:ax.spines[e].set_color(GRID)
    ax.set_xticks([]);ax.set_yticks([]);ax.set(xlim=(0,M*a+1.5),ylim=(0,M*(kd+d)*1.05))
    ax.set_xlabel('глубина $z$',fontsize=20,labelpad=6,loc='center');ax.set_ylabel('фаза',fontsize=20,labelpad=6)
    ax.text(.15,M*(kd+d)*.95,'вещество: $k_{\\rm med}z=nkz$',color=TOT,fontsize=19,va='top')
    ax.text(M*a-.1,M*kd*.55,'вакуум: $kz$',color=INC,fontsize=19,ha='right')
    zx=M*a+.15
    ax.plot([M*a,zx],[(kd+d)*M*a]*2,color=TOT,lw=1,ls=':');ax.plot([M*a,zx],[kd*M*a]*2,color=INC,lw=1,ls=':')
    ax.annotate('',(zx,(kd+d)*M*a),(zx,kd*M*a),arrowprops={'arrowstyle':'<->','color':TXT,'lw':1.8,'shrinkA':0,'shrinkB':0})
    ax.text(zx+.1,(kd+d/2)*M*a,'$(n-1)kz$',fontsize=19,ha='left',va='center')
    save(fig,'phase-depth')


def state_plane():
    th=np.radians(33.7);R=1.35
    fig=plt.figure(figsize=(7.2,6.4));ax=fig.add_axes([0,0,1,1])
    ax.set(xlim=(-.95,1.85),ylim=(-1.0,1.7),aspect='equal');ax.axis('off')
    arrow(ax,(-.8,0),(1.6,0),GRID,lw=1.6,ms=16);arrow(ax,(0,-.8),(0,1.5),GRID,lw=1.6,ms=16)
    ax.text(1.66,-.02,'$\\nu_e$',fontsize=26,color=MUT,va='center')
    ax.text(.06,1.52,'$\\nu_x$',fontsize=26,color=MUT,va='center')
    w1=np.array([np.cos(th),-np.sin(th)]);w2=np.array([np.sin(th),np.cos(th)])
    for v,lab,off in [(w1,'$\\nu_1$',(.05,-.1)),(w2,'$\\nu_2$',(.05,.04))]:
        ax.plot([-.5*v[0],R*v[0]],[-.5*v[1],R*v[1]],color=VIO,lw=1.8,ls=(0,(2,3)))
        ax.text(R*v[0]+off[0],R*v[1]+off[1],lab,fontsize=24,color=VIO)
    ax.add_patch(Arc((0,0),.6,.6,theta1=-np.degrees(th),theta2=0,color=VIO,lw=1.6))
    ax.text(.36,-.11,'$\\theta$',fontsize=21,color=VIO,va='center')
    psi=np.array([.95,.52])
    ax.plot([psi[0],psi[0]],[0,psi[1]],color=MUT,lw=1.3,ls=(0,(3,3)));ax.plot([0,psi[0]],[psi[1],psi[1]],color=MUT,lw=1.3,ls=(0,(3,3)))
    arrow(ax,(0,0),tuple(psi),TOT,lw=4.2)
    ax.text(psi[0]+.04,.5*psi[1],'$\\psi_x$',fontsize=23,color=TXT,va='center')
    ax.text(psi[0],-.13,'$\\psi_e$',fontsize=23,color=TXT,ha='center')
    ax.text(psi[0]+.04,psi[1]+.1,'$|\\psi\\rangle$',fontsize=26,color=TOT)
    save(fig,'state-plane')


def anisotropy_arrows():
    th=np.radians(33.7);A=2.05
    vac=np.array([np.cos(2*th),-np.sin(2*th)]);mat=np.array([-A,0.0]);tot=vac+mat
    tm=np.degrees(np.arctan2(-tot[1],tot[0]))/2          # 2 theta_m = 151 deg
    L=np.hypot(*tot)
    fig=plt.figure(figsize=(8.4,5.0));ax=fig.add_axes([0,0,1,1])
    ax.set(xlim=(-2.2,2.05),ylim=(-1.75,.4),aspect='equal');ax.axis('off')
    arrow(ax,(-2.0,0),(1.3,0),GRID,lw=1.6,ms=16)
    ax.text(1.36,.0,'ось $\\nu_e$',fontsize=19,color=MUT,va='center')
    arrow(ax,(0,0),tuple(vac),VIO,lw=4.2)
    arrow(ax,tuple(vac),tuple(vac+mat),INC,lw=4.2)
    arrow(ax,(0,0),tuple(tot),TOT,lw=4.8)
    ax.add_patch(Arc((0,0),.9,.9,theta1=-2*np.degrees(th),theta2=0,color=VIO,lw=1.8))
    ax.text(.55,-.16,'$2\\theta$',fontsize=22,color=VIO,va='center')
    ax.add_patch(Arc((0,0),2.5,2.5,theta1=-2*tm,theta2=0,color=TOT,lw=1.8))
    ax.text(-.3,-1.45,'$2\\theta_m$',fontsize=22,color=TOT,va='center',ha='center')
    ax.text(vac[0]+.12,vac[1]*.5,'вакуум\n$\\Delta k=\\Delta m^2/2E$',fontsize=19,color=VIO,ha='left',va='center',linespacing=1.2)
    ax.text(vac[0]+mat[0]/2,vac[1]-.1,'вещество: $V$',fontsize=19,color=INC,ha='center',va='top')
    ax.text(-1.15,-.22,'сумма: $\\Delta k_m$',fontsize=21,color=TOT,ha='center',va='center')
    save(fig,'anisotropy-arrows')
    print('theta_m=%.2f deg, Dk_m/Dk=%.3f'%(tm,L))


def eigen_axes():
    th=np.radians(33);tm=np.radians(75);R=1.25
    fig=plt.figure(figsize=(7.6,7.0));ax=fig.add_axes([0,0,1,1])
    ax.set(xlim=(-1.0,1.95),ylim=(-1.62,1.62),aspect='equal');ax.axis('off')
    arrow(ax,(-.8,0),(1.6,0),GRID,lw=1.6,ms=16);arrow(ax,(0,-1.05),(0,1.45),GRID,lw=1.6,ms=16)
    ax.text(1.66,-.02,'$\\nu_e$',fontsize=26,color=MUT,va='center')
    ax.text(.06,1.45,'$\\nu_x$',fontsize=26,color=MUT,va='center')
    # vacuum mass axes: nu_e = cos th nu_1 + sin th nu_2
    w1=np.array([np.cos(th),-np.sin(th)]);w2=np.array([np.sin(th),np.cos(th)])
    for v,lab,off in [(w1,'$\\nu_1$',(.05,-.1)),(w2,'$\\nu_2$',(.04,.03))]:
        ax.plot([-.6*v[0],R*v[0]],[-.6*v[1],R*v[1]],color=VIO,lw=1.6,ls=(0,(2,3)),alpha=.9)
        ax.text(R*v[0]+off[0],R*v[1]+off[1],lab,fontsize=24,color=VIO)
    ax.add_patch(Arc((0,0),.6,.6,theta1=-np.degrees(th),theta2=0,color=VIO,lw=1.6))
    ax.text(.34,-.1,'$\\theta$',fontsize=21,color=VIO,va='center')
    # matter eigenwaves
    v1=np.array([np.cos(tm),-np.sin(tm)]);v2=np.array([np.sin(tm),np.cos(tm)])
    for v,col,lab,off in [(v1,TOT,'$\\nu_{\\rm mat,1}$',(.07,-.1)),(v2,SEC,'$\\nu_{\\rm mat,2}$',(.04,.05))]:
        ax.plot([-.75*v[0],R*v[0]],[-.75*v[1],R*v[1]],color=col,lw=1.6,ls=(0,(6,4)),alpha=.8)
        ax.text(R*v[0]+off[0],R*v[1]+off[1],lab,fontsize=26,color=col)
    arrow(ax,(0,0),(1,0),INC,lw=4.2)
    a=np.cos(tm)*v1;b=np.sin(tm)*v2
    arrow(ax,(0,0),tuple(a),TOT,lw=3.4);arrow(ax,(0,0),tuple(b),SEC,lw=3.4)
    ax.plot([a[0],1],[a[1],0],color=MUT,lw=1.2,ls=(0,(3,3)));ax.plot([b[0],1],[b[1],0],color=MUT,lw=1.2,ls=(0,(3,3)))
    ax.add_patch(Arc((0,0),1.0,1.0,theta1=-np.degrees(tm),theta2=0,color=TXT,lw=1.6))
    ax.text(.1,-.62,'$\\theta_m$',fontsize=23)
    ax.text(.4,-1.5,'$\\nu_e=\\cos\\theta_m\\,\\nu_{\\rm mat,1}+\\sin\\theta_m\\,\\nu_{\\rm mat,2}$',fontsize=22,ha='center',color=TXT)
    save(fig,'eigen-axes')


def fresnel_rings():
    L,lam,N=9.0,1.0,7                       # schematic: lambda enlarged, so b_N is comparable to L
    yaw,pitch=np.radians(30),np.radians(14)
    def P(x,y,z):
        X=z*np.cos(yaw)+x*np.sin(yaw);depth=-z*np.sin(yaw)+x*np.cos(yaw)
        return np.array([X,y*np.cos(pitch)+depth*np.sin(pitch)])
    b=lambda m:np.sqrt((L+m*lam/2)**2-L**2)
    t=np.linspace(0,2*np.pi,241)
    ring=lambda r:np.array([P(r*np.cos(a),r*np.sin(a),0.0) for a in t])
    fig=plt.figure(figsize=(7.6,7.9));ax=fig.add_axes([0,0,1,1]);ax.set(xlim=(-7.6,10.6),ylim=(-9.2,9.8),aspect='equal');ax.axis('off')
    for m in range(N,0,-1):                 # outer zones first, inner ones on top
        o=ring(b(m));i=ring(b(m-1));col=INC if m%2 else SEC
        ax.fill(np.r_[o[:,0],i[::-1,0]],np.r_[o[:,1],i[::-1,1]],color=col,alpha=.34 if m%2 else .30,lw=0)
        ax.plot(o[:,0],o[:,1],color=col,lw=1.8)
    for m in range(1,N+1):                  # zone numbers in the bands above the axis
        r=(b(m-1)+b(m))/2 if m>1 else 0.0
        c=P(0,-r,0);ax.text(c[0],c[1],str(m),fontsize=17,color=TXT,ha='center',va='center')
    for y in (-3.6,0.0,3.6):                # incident wave
        arrow(ax,tuple(P(0,y,-7.0)),tuple(P(0,y,-1.6)),INC,lw=3,ms=20)
    ax.text(*(P(0,5.2,-6.6)),'падающая\nволна',color=INC,fontsize=19,ha='center',va='bottom')
    ax.text(-6.4,-6.6,'слой',fontsize=22,color=TXT,ha='center')
    O=P(0,0,0);Pp=P(0,0,L)
    ax.plot([O[0],Pp[0]],[O[1],Pp[1]],color=MUT,lw=1.6,ls=(0,(6,4)))
    ax.plot(*Pp,'o',color=TOT,ms=11)
    ax.text(Pp[0]+.4,Pp[1],'$P$',fontsize=26,color=TOT,va='center')
    ax.text((O[0]+Pp[0])/2+1.1,(O[1]+Pp[1])/2-.95,'$z$',fontsize=24,color=TXT,ha='center')
    for m in range(1,N):                    # rays from the zone edges to P
        e=P(0,b(m),0);ax.plot([e[0],Pp[0]],[e[1],Pp[1]],color=TOT,lw=1.3,alpha=.7)
    e=P(0,b(N),0);ax.plot([e[0],Pp[0]],[e[1],Pp[1]],color=TOT,lw=2.8);ax.plot(*e,'o',color=TOT,ms=9)
    d0=P(0,b(N),3.2);ax.plot([e[0],d0[0]],[e[1],d0[1]],color=MUT,lw=1.4,ls=(0,(4,3)))
    th=np.arccos(L/(L+N*lam/2));rr=2.6;ang=np.linspace(0,th,30)
    arcp=np.array([P(0,b(N)-rr*np.sin(a),rr*np.cos(a)) for a in ang]);ax.plot(arcp[:,0],arcp[:,1],color=TXT,lw=1.6)
    ax.text(*(P(0,b(N)-rr*1.2*np.sin(th/2),rr*1.2*np.cos(th/2))+[.2,0]),'$\\vartheta$',fontsize=21,color=TXT,va='center')
    mid=(e+Pp)/2;ax.text(mid[0]+.6,mid[1]+.4,'$r_m=z+m\\lambda/2$',fontsize=21,color=TOT,ha='left')
    save(fig,'fresnel-rings')


if __name__=='__main__':
    style();layer_phasor();plate_experiment();phase_depth();eigen_axes();state_plane();anisotropy_arrows();fresnel_rings()
