#!/usr/bin/env python3
"""Reproducible teaching diagrams for lecture 08; no experimental data are drawn.
Drawing primitives and palette are shared with the lecture-07 figure generator.
"""
from pathlib import Path
import importlib.util
import math
import numpy as np
try:
    from scipy.constants import e, m_e, c, epsilon_0, parsec
except ModuleNotFoundError:          # те же значения CODATA, чтобы скрипт шёл без SciPy
    e, m_e, c = 1.602176634e-19, 9.1093837015e-31, 299792458.0
    epsilon_0, parsec = 8.8541878128e-12, 3.0856775814913673e16
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("lecture07_figures", OUT.parent/"07_katrin"/"generate_figures.py")
common=importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)
common.OUT=OUT
D, save=common.Diagram, common.save
BLUE,GOLD,GREEN,RED,INK,MUTED,PANEL=common.BLUE,common.GOLD,common.GREEN,common.RED,common.INK,common.MUTED,common.PANEL
REST=m_e*c*c/e
F0=e/(2*np.pi*m_e)
frequency=lambda energy: F0/(1+energy/REST)

# Приёмник Project 8 Phase II: шум системы и ширина одной фурье-линии.
K_B=1.380649e-23
T_SYS=132.0
T_OBS=100e-6
LINE_WIDTH=.886/T_OBS
NOISE_BIN=K_B*T_SYS*LINE_WIDTH
CUTOFF_SIMPLE=c/(2*10e-3)


def diagrams():
    d=D(1500,520,"Три способа преобразовать энергию в наблюдаемый сигнал")
    for y, name, mid, final, color in [
        (50,"KATRIN","Электростатический порог","Число прошедших электронов",BLUE),
        (215,"CRES","Циклотронная частота","Радиосигнал одного электрона",GOLD),
        (380,"Калориметр","Нагрев поглотителя","Тепловой импульс",GREEN)]:
        d.box(20,y,260,110,name,color,30)
        d.box(380,y,480,110,mid,color,28)
        d.box(960,y,520,110,final,color,26)
        d.arrow(290,y+55,368,y+55,color)
        d.arrow(870,y+55,948,y+55,color)
    d.save("energy-readout.svg")

    d=D(1460,470,"Приём и измерение циклотронного радиосигнала")
    for x,w,lines,col in [
        (20,240,["Электрон","в ловушке"],GOLD),
        (335,260,["Волновод","или резонатор"],BLUE),
        (670,270,["Малошумящий","усилитель"],GREEN),
        (1015,420,["Смешение с опорной частотой","и оцифровка"],RED)]:
        d.box(x,135,w,125,lines,col,25)
    for x,y in [(270,323),(605,658),(950,1003)]:
        d.arrow(x,198,y,198)
    d.text(725,75,"Сигнал сохраняет частоту и фазу циклотронного движения.",INK,28)
    d.text(260,345,["Доля фемтоватта","в приёмной системе"],GOLD,26)
    d.text(1080,345,["Анализ коротких временных участков","→ спектрограмма: мощность (t, f)"],RED,26)
    d.save("cres-receiver.svg")

    d=D(1050,680,"Электронный захват внутри калориметра")
    d.box(60,100,710,450,"",GOLD)
    d.text(415,148,"Поглотитель",GOLD,31)
    d.box(245,205,330,80,"Атом ¹⁶³Ho",GOLD,31)
    d.arrow(413,294,413,350,GOLD)
    d.box(245,365,330,80,["Атом ¹⁶³Dy","с вакансией"],BLUE,28)
    d.arrow(582,270,975,270,RED)
    d.text(860,222,"νₑ уходит",RED,28)
    d.text(880,318,"Eν",RED,32)
    d.text(415,505,"Рентген, оже-электроны, отдача → тепло",INK,26)
    d.arrow(415,558,415,613,GREEN)
    d.text(415,660,"Измерено: Eс = Q − Eν",GREEN,34)
    d.save("holmium-capture.svg")

    d=D(1150,580,"Тепловая модель микрокалориметра")
    d.box(40,120,510,195,["Поглотитель с ¹⁶³Ho","теплоёмкость C","температура T₀ + ΔT"],GOLD,30)
    d.arrow(160,42,220,107,GOLD)
    d.text(80,33,"Eс",GOLD,31)
    d.box(655,145,420,145,["Термометр","электрический сигнал"],BLUE,29)
    d.arrow(560,218,643,218,BLUE)
    d.arrow(295,326,295,438,GREEN)
    d.text(370,381,["Тепловая связь G","мощность G · ΔT"],GREEN,26,"start")
    d.box(65,450,970,95,"Термостат: постоянная температура T₀",GREEN,30)
    d.save("microcalorimeter.svg")

    d=D(1200,400,"Распад покоящегося пиона")
    d.box(455,120,290,110,["Пион","покоится"],GOLD,30)
    d.arrow(440,175,110,175,RED)
    d.arrow(760,175,1085,175,BLUE)
    d.text(180,118,"Нейтрино",RED,30)
    d.text(1030,118,"Мюон",BLUE,30)
    d.text(600,300,"Импульсы равны по модулю и противоположны.",INK,30)
    d.text(600,350,"Измеряем импульс мюона — остальное даёт кинематика.",MUTED,26)
    d.save("missing-mass.svg")

    d=D(1480,470,"Установка Project 8: ячейка, магнит, приёмник")
    d.box(30,150,470,190,"",MUTED)
    d.text(265,120,"Сверхпроводящий магнит, 0,959 Тл",MUTED,25)
    d.box(70,190,390,110,["Волновод-ячейка с тритием","круглая труба ⌀10 мм, ~1 см³"],GOLD,24)
    d.text(265,375,"Катушки ловушки удерживают электрон",GOLD,24)
    d.box(560,195,330,100,["Охлаждаемый усилитель","T шума = 132 К"],BLUE,25)
    d.box(950,195,230,100,["Смеситель","и АЦП"],GREEN,26)
    d.box(1240,195,215,100,["Спектро-","грамма"],RED,26)
    for x1,x2 in [(465,555),(895,945),(1185,1235)]:
        d.arrow(x1,245,x2,245)
    d.text(900,90,"Сигнал у конца спектра трития: 26 ГГц",INK,26)
    d.text(740,430,"Электроны рождаются, удерживаются и слушаются в одном объёме.",MUTED,25)
    d.save("project8-apparatus.svg")

    d=D(1500,520,"От захвата электрона до спектра")
    d.box(20,150,330,150,["Атом ¹⁶³Ho","внутри поглотителя"],GOLD,25)
    d.box(400,150,330,150,["Каскад: рентген,","оже-электроны, отдача"],BLUE,25)
    d.box(780,150,300,150,["Нагрев поглотителя","ΔT = Eс / C"],GREEN,25)
    d.box(1130,150,350,150,["Термометр:","импульс высотой Eс"],RED,25)
    for x1,x2 in [(355,395),(735,775),(1085,1125)]:
        d.arrow(x1,225,x2,225)
    d.arrow(185,145,185,60,MUTED)
    d.text(185,40,"нейтрино уносит Eν",MUTED,25)
    d.text(750,390,"Измерено: Eс = Q − Eν",INK,34)
    d.text(750,455,"Спектр таких импульсов и несёт массу нейтрино.",MUTED,26)
    d.save("calorimeter-overview.svg")


def figures():
    energy=np.linspace(0,30,400)
    fig,ax=plt.subplots(figsize=(11,5.4))
    ax.plot(energy,frequency(energy*1e3)/1e9,color=BLUE,lw=3)
    ax.plot(18.6,frequency(18600)/1e9,"o",color=GOLD)
    ax.annotate("18,6 кэВ → 27,01 ГГц",(18.6,frequency(18600)/1e9),
                xytext=(7,27.65),color=GOLD,arrowprops={"arrowstyle":"->","color":GOLD})
    ax.set(xlabel="Кинетическая энергия E, кэВ",ylabel="Циклотронная частота, ГГц",title="Однородное поле B = 1 Тл")
    ax.grid(alpha=.15)
    save(fig,"frequency-energy.svg")

    t=np.linspace(0,400,801)
    # A fixed radiation loss plus one 12.6-eV collision: schematic, not track data.
    loss=1.2e-15/e*t*1e-6
    collision=t>=240
    ec=18600-loss-12.6*collision
    freq=(frequency(ec)-frequency(18600))/1e3
    fig,ax=plt.subplots(figsize=(11,5.5))
    for offset in [-100,100]:
        ax.plot(t[~collision],freq[~collision]+offset,color=BLUE,lw=1.6,alpha=.65)
        ax.plot(t[collision],freq[collision]+offset,color=BLUE,lw=1.6,alpha=.65)
    ax.plot(t[~collision],freq[~collision],color=GOLD,lw=4,label="Основная линия")
    ax.plot(t[collision],freq[collision],color=GOLD,lw=4)
    ax.axvline(240,color=RED,ls=":",lw=2)
    ax.text(245,430,"Столкновение",color=RED,fontsize=17)
    ax.annotate("Излучение: частота растёт",(140,freq[280]),
                xytext=(15,360),color=GOLD,arrowprops={"arrowstyle":"->","color":GOLD})
    ax.set(xlabel="Время, мкс",ylabel="f − fнач, кГц",ylim=(-160,950))
    ax.grid(alpha=.12)
    save(fig,"cres-track.svg")

    z=np.linspace(-1,1,401); field=1+.002*z*z
    alpha=88.5
    mirror=1/np.sin(np.deg2rad(alpha))**2
    zm=np.sqrt((mirror-1)/.002)
    fig,ax=plt.subplots(figsize=(11,5.2))
    ax.plot(z,1e3*(field-1),color=BLUE,lw=3)
    ax.axhline((mirror-1)*1e3,color=GOLD,ls="--")
    ax.fill_between(z,0,(mirror-1)*1e3,where=abs(z)<=zm,color=GOLD,alpha=.12)
    ax.plot([-zm,zm],[(mirror-1)*1e3]*2,"o",color=GOLD)
    ax.text(0,.36,"Движение между\nзеркальными точками",ha="center",color=GOLD,fontsize=16)
    ax.set(xlabel="Координата вдоль ловушки z / ℓ",ylabel="(B / B₀ − 1) · 10³",
           title="Слабая ловушка: α₀ = 88,5°",ylim=(0,2.25))
    ax.grid(alpha=.15)
    save(fig,"shallow-trap.svg")

    Q=2863.
    def atomic(x):
        # Two illustrative single-hole lines; not a fitted Ho response.
        return sum(a*g/(2*np.pi)/((x-e0)**2+g*g/4)
                   for e0,g,a in [(2040.,13.,1.),(410.,5.,.15)])
    def spectrum(x,m=0):
        nu=np.maximum(Q-x,0)
        return atomic(x)*nu*np.sqrt(np.maximum(nu*nu-m*m,0))
    x=np.linspace(0,Q,12000)
    fig,axes=plt.subplots(1,2,figsize=(15,5.6))
    norm=np.max(spectrum(x))
    axes[0].semilogy(x,spectrum(x)/norm,color=BLUE,lw=2.5)
    axes[0].set(xlabel="Eс, эВ",ylabel="Спектр, отн. ед.",ylim=(1e-10,2),
                title="Атомные линии и их хвосты")
    axes[0].axvline(Q,color=GOLD,ls=":")
    axes[0].text(Q-20, .04,"Q",color=GOLD,ha="right")
    endpoint=np.linspace(Q-50,Q,600)
    normend=spectrum(endpoint[0])
    for m,col in [(0,BLUE),(10,GOLD)]:
        axes[1].plot(Q-endpoint,spectrum(endpoint,m)/normend,color=col,lw=3,label=f"m = {m} эВ")
    axes[1].set(xlabel="Недостающая энергия Q − Eс, эВ",
                ylabel="Спектр, отн. ед.",title="У самой границы")
    axes[1].legend(facecolor=PANEL,labelcolor=INK,fontsize=14)
    for ax in axes:ax.grid(alpha=.13)
    fig.tight_layout()
    save(fig,"holmium-spectrum.svg")

    temp=np.linspace(.7,1.3,500)
    fig,axes=plt.subplots(1,2,figsize=(14,5.2))
    axes[0].plot(temp,1/temp,color=GREEN,lw=3)
    axes[0].set(xlabel="Температура T / T₀",ylabel="Намагниченность M / M₀",
                title="Магнитный термометр")
    axes[0].annotate("Нагрев: M уменьшается",(1.1,1/1.1),
                    xytext=(.73,.83),fontsize=16,color=GREEN,arrowprops={"arrowstyle":"->","color":GREEN})
    axes[1].plot(temp,1/(1+np.exp(-(temp-1)/.025)),color=GOLD,lw=3)
    axes[1].set(xlabel="Температура T / Tс",ylabel="Сопротивление R / Rн",
                title="Сверхпроводящий термометр")
    axes[1].annotate("Рабочая точка",(1,.5),xytext=(.74,.75),fontsize=16,
                    color=GOLD,arrowprops={"arrowstyle":"->","color":GOLD})
    for ax in axes:ax.grid(alpha=.13)
    fig.tight_layout()
    save(fig,"thermometers.svg")

    time=np.linspace(-.2,2.8,1000)
    def pulse(dt):
        t=np.maximum(dt,0)
        return (np.exp(-t/.6)-np.exp(-t/.06))*(dt>=0)
    fig,axes=plt.subplots(1,2,figsize=(14,5.2))
    for ax,dt,title in zip(axes,[1.,.03],["Разделённые события","Неразрешённое наложение"]):
        first=pulse(time);second=.7*pulse(time-dt)
        ax.plot(time,first,color=BLUE,ls="--",lw=2,label="Первое")
        ax.plot(time,second,color=GREEN,ls="--",lw=2,label="Второе")
        ax.plot(time,first+second,color=GOLD,lw=3,label="Сумма")
        ax.set(xlabel="Время, мс",ylabel="Сигнал, отн. ед.",title=title,ylim=(0,1.5))
        ax.grid(alpha=.13)
    axes[1].legend(fontsize=12,facecolor=PANEL,labelcolor=INK)
    fig.tight_layout()
    save(fig,"pulse-overlap.svg")

    M=1776.86; gamma=10.;beta=math.sqrt(1-gamma**-2)
    fig,ax=plt.subplots(figsize=(10.5,5.7))
    for mass,color in [(0,BLUE),(100,GOLD)]:
        xx=np.linspace(3*139.57,M-mass,800)
        est=(M*M+xx*xx-mass*mass)/(2*M)
        pp=np.sqrt(np.maximum(est*est-xx*xx,0))
        low=(est-beta*pp)/M;high=(est+beta*pp)/M
        ax.fill_between(xx/M,low,high,color=color,alpha=.09)
        ax.plot(xx/M,low,color=color,lw=2,label=f"mν = {mass} МэВ")
        ax.plot(xx/M,high,color=color,lw=2)
    ax.set(xlabel="mX / mτ",ylabel="EX / Eτ",title="Границы для фиксированной энергии τ")
    ax.legend(facecolor=PANEL,labelcolor=INK,fontsize=14,loc="lower right")
    ax.grid(alpha=.15)
    save(fig,"tau-boundary.svg")

    en=np.linspace(5,50,400)
    fig,ax=plt.subplots(figsize=(10.5,5.4))
    for mass,col in [(1,BLUE),(3,GOLD)]:
        delay=(1e4*parsec)/(2*c)*(mass/(en*1e6))**2*1000
        ax.plot(en,delay,color=col,lw=3,label=f"m = {mass} эВ")
    ax.set(xlabel="Энергия нейтрино, МэВ",ylabel="Задержка относительно света, мс",
           title="Одинаковое время рождения, расстояние 10 кпк")
    ax.legend(facecolor=PANEL,labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig,"flight-delay.svg")

    ml=np.linspace(0,.12,601)
    v2=np.array([.978*.693,.978*.307,.022])
    dm21,dm31=7.5e-5,2.5e-3
    no=np.sqrt(ml*ml+v2[1]*dm21+v2[2]*dm31)
    io=np.sqrt(ml*ml+(v2[0]+v2[1])*dm31+v2[1]*dm21)
    fig,ax=plt.subplots(figsize=(11,5.5))
    ax.plot(ml*1e3,no*1e3,color=BLUE,lw=3,label="Нормальный порядок")
    ax.plot(ml*1e3,io*1e3,color=GOLD,lw=3,label="Обратный порядок")
    ax.axhline(40,color=GREEN,ls="--",lw=2,label="Цель 40 мэВ")
    ax.set(xlabel="Самая лёгкая масса, мэВ",ylabel="mβ, мэВ",ylim=(0,140))
    ax.legend(fontsize=14,facecolor=PANEL,labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig,"mass-ordering.svg")

    # Шкала мощностей: бытовые источники, принимаемые сигналы, шум приёмника.
    def sci(value):
        exponent=int(math.floor(math.log10(value)))
        mantissa=f"{value/10**exponent:.1f}".rstrip("0").rstrip(".").replace(".","{,}")
        head="" if mantissa=="1" else mantissa+r"\cdot"
        return rf"${head}10^{{{exponent}}}$ Вт"
    rows=[(1e5,"Телевизионный передатчик",MUTED),
          (8e2,"Микроволновая печь",MUTED),
          (2e-1,"Телефон: передача",MUTED),
          (1e-10,"Приём от базовой станции",BLUE),
          (1.2e-15,"Электрон в CRES",GOLD),
          (1.4e-16,"Сигнал GPS на антенне",BLUE),
          (NOISE_BIN,"Шум приёмника в одной линии",RED)]
    fig,ax=plt.subplots(figsize=(12,5.6))
    ypos=np.arange(len(rows))[::-1]
    ax.barh(ypos,[r[0] for r in rows],left=1e-19,height=.55,
            color=[r[2] for r in rows],alpha=.75)
    for y,(value,label,color) in zip(ypos,rows):
        ax.text(value*2.6,y,sci(value),va="center",color=color,fontsize=15)
    ax.set_yticks(ypos,[r[1] for r in rows],fontsize=16)
    ax.set_xscale("log")
    ax.set_xlim(1e-19,1e10)
    ax.set_xlabel("Мощность, Вт")
    ax.grid(alpha=.15,axis="x",which="both")
    save(fig,"power-ladder.svg")

    # Волновод: поперечная мода и отсечка. Резонатор: стоячая волна и добротность.
    fig,axes=plt.subplots(1,2,figsize=(14.5,5.0))
    ax=axes[0]
    yy=np.linspace(-1,1,120)
    for wall in (-1,1):
        ax.plot([0,10],[wall,wall],color=MUTED,lw=5)
    for x0,alpha in [(2.2,1.0),(5.6,.4),(9.0,.4)]:
        ax.plot([x0,x0],[-1,1],color=MUTED,ls=":",lw=1.2,alpha=alpha)
        ax.plot(x0+1.15*np.cos(np.pi*yy/2),yy,color=BLUE,lw=3,alpha=alpha)
    ax.annotate("",(0,-1),(0,1),arrowprops={"arrowstyle":"<->","color":GREEN,"lw":2})
    ax.text(.3,0,"d",color=GREEN,fontsize=20,va="center")
    ax.arrow(1.2,1.5,7.2,0,color=GOLD,width=.015,head_width=.16,length_includes_head=True)
    ax.text(4.8,1.68,"волна идёт вдоль трубы",color=GOLD,fontsize=15,ha="center")
    ax.text(5,-1.55,"Поле обращается в нуль на стенках: поперёк укладывается\nполуволна, поэтому проходит только f > c/2d",
            color=MUTED,fontsize=15,ha="center",va="top")
    ax.set(xlim=(-.6,11.4),ylim=(-2.5,2.1),title="Волновод")
    ax=axes[1]
    xs=np.linspace(0,10,600)
    for wall in (0,10):
        ax.plot([wall,wall],[-1.25,1.25],color=MUTED,lw=5)
    ax.plot(xs,np.sin(3*np.pi*xs/10),color=GOLD,lw=3)
    ax.plot(xs,.55*np.sin(4*np.pi*xs/10),color=BLUE,lw=2.5,alpha=.55)
    ax.axhline(0,color=MUTED,lw=.8)
    ax.text(10.6,1.0,"мода 3",color=GOLD,fontsize=14,ha="right")
    ax.text(10.6,-1.0,"мода 4",color=BLUE,fontsize=14,ha="right",alpha=.85)
    ax.text(5,1.75,"Волна отражается от стенок и складывается сама с собой",
            color=INK,fontsize=15,ha="center")
    ax.text(5,-1.55,"Добротность Q = f / Δf показывает,\nсколько периодов поле живёт в полости",
            color=MUTED,fontsize=15,ha="center",va="top")
    ax.set(xlim=(-.8,11.2),ylim=(-2.5,2.1),title="Резонатор")
    for ax in axes:
        ax.set_xticks([]);ax.set_yticks([])
        for side in ax.spines.values():side.set_visible(False)
    fig.tight_layout()
    save(fig,"waveguide-resonator.svg")

    # Качание вдоль ловушки модулирует фазу и рождает гребёнку линий.
    fz,h=25.,1.2
    t=np.linspace(0,3/fz,1200)
    fig,axes=plt.subplots(1,2,figsize=(15,5.2))
    ax=axes[0]
    inst=.45*np.cos(2*np.pi*2*fz*t)+.18*np.cos(2*np.pi*fz*t)
    ax.plot(t*1e3,inst,color=GOLD,lw=3,label="мгновенная частота")
    ax.axhline(0,color=BLUE,ls="--",lw=2,label="частота в среднем поле")
    ax.set(xlabel="Время, мкс",ylabel="f − fc, отн. ед.",
           title="Частота качается вместе с электроном",ylim=(-.95,.95))
    ax.legend(fontsize=13,facecolor=PANEL,labelcolor=INK,loc="lower right")
    ax.grid(alpha=.13)
    ax=axes[1]
    orders=np.arange(-6,7)
    def bessel(n,x):
        total=0.
        for k in range(30):
            total+=(-1)**k*(x/2)**(2*k+abs(n))/(math.factorial(k)*math.factorial(k+abs(n)))
        return total*(-1 if (n<0 and abs(n)%2) else 1)
    power=np.array([bessel(n,h)**2 for n in orders])
    ax.vlines(orders*fz,0,power/power.max(),color=GOLD,lw=4)
    ax.plot(orders*fz,power/power.max(),"o",color=GOLD,ms=7)
    ax.set(xlabel="f − fc, кГц",ylabel="Мощность линии, отн. ед.",
           title="Гребёнка линий, шаг fz = 25 кГц",ylim=(0,1.15))
    ax.text(0,1.05,"h = 1,2",color=INK,fontsize=16,ha="center")
    ax.grid(alpha=.13)
    fig.tight_layout()
    save(fig,"sidebands-origin.svg")


def verify():
    f=frequency(18600)
    df=f*.1/(REST+18600)
    gamma=1+18600/REST; beta2=1-gamma**-2
    power=e**4/(6*np.pi*epsilon_0*m_e**2*c)*gamma**2*beta2
    delay=1e4*parsec/(2*c)*1e-14
    assert 27e9<f<27.02e9 and 5050<df<5150
    assert 1.1e-15<power<1.3e-15
    assert abs(delay-.005146)<1e-6
    assert abs(1-math.exp(-10e-6)-1e-5)<1e-9
    assert abs(LINE_WIDTH-8860)<1
    assert 1.5e-17<NOISE_BIN<1.7e-17
    assert abs((REST+18600)*LINE_WIDTH/f-.1737)<1e-3
    assert 1.4e10<CUTOFF_SIMPLE<1.6e10
    print(f"fc={f/1e9:.6f} GHz; δf(0.1 eV)={df:.1f} Hz; "
          f"P={power/1e-15:.3f} fW; rectangular-window time={.886/df*1e6:.1f} μs; "
          f"flight delay={delay*1e3:.4f} ms; "
          f"line width(100 us)={LINE_WIDTH/1e3:.2f} kHz -> "
          f"{(REST+18600)*LINE_WIDTH/f:.3f} eV; noise/bin={NOISE_BIN:.2e} W; "
          f"waveguide cutoff(simple)={CUTOFF_SIMPLE/1e9:.1f} GHz.")

if __name__=="__main__":
    verify()
    diagrams()
    figures()

