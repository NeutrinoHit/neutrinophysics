"""Two static views of the Lorentz current-sheet model used in lecture 11.

Time convention exp(-i omega t), lengths in vacuum wavelengths. Each sheet
is driven by its total local field. The backward transfer recursion is the
same as solveStack in the adjacent refraction_origin.js; reflections and
weak oscillator damping are retained. No refractive index is supplied.
"""
from pathlib import Path
import json,tomllib
import numpy as np
from scipy import optimize,signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

HERE=Path(__file__).resolve().parent
CFG=tomllib.loads((HERE/'config.toml').read_text())
P=CFG['physics'];S=CFG['figure'];K=2*np.pi
BETA=P['surface_strength']/(1-P['frequency_ratio']**2-1j*P['damping_ratio']*P['frequency_ratio'])


class Stack:
    def __init__(self,positions,beta=BETA,k=K):
        self.positions=np.asarray(positions);self.beta=beta;self.k=k
        coefficients=np.zeros((len(positions)+1,2),complex);coefficients[-1]=[1,0]
        A,B=1+0j,0j
        for j in range(len(positions)-1,-1,-1):
            z=positions[j];ep=np.exp(1j*k*z);em=np.conj(ep)
            E=A*ep+B*em;d_right=1j*k*(A*ep-B*em)
            ratio=(d_right+2*k*beta*E)/(1j*k)
            A=(E+ratio)*em/2;B=(E-ratio)*ep/2
            coefficients[j]=[A,B]
        self.coefficients=coefficients/coefficients[0,0]
        self.t=self.coefficients[-1,0];self.r=self.coefficients[0,1]
    def field(self,z):
        z=np.asarray(z);regions=np.searchsorted(self.positions,z,side='right')
        A,B=self.coefficients[regions].T
        return A*np.exp(1j*self.k*z)+B*np.exp(-1j*self.k*z)
    def real(self,z,phase):return (self.field(z)*np.exp(-1j*phase)).real


def bloch_index(beta=BETA):
    ka=K*P['spacing_lambda0'];q=np.arccos(complex(np.cos(ka)-beta*np.sin(ka)))
    if q.real<0:q=-q
    return q/ka


def validation():
    one=Stack([0]);analytic=1/(1-1j*BETA)
    assert abs(one.t-analytic)<1e-13 and abs(one.r-(analytic-1))<1e-13
    a=P['spacing_lambda0'];positions=(np.arange(P['sheets'])+.5)*a;stack=Stack(positions)
    jumps=[];continuity=[]
    for j,z in enumerate(positions):
        ep=np.exp(1j*K*z);em=np.conj(ep)
        Al,Bl=stack.coefficients[j];Ar,Br=stack.coefficients[j+1]
        left=Al*ep+Bl*em;right=Ar*ep+Br*em
        continuity.append(abs(right-left))
        jumps.append(abs(1j*K*((Ar-Al)*ep-(Br-Bl)*em)+2*K*BETA*left))
    local=stack.field(positions)
    absorption=2*BETA.imag*np.sum(abs(local)**2)
    balance=abs(1-abs(stack.r)**2-abs(stack.t)**2-absorption)
    assert max(continuity)<1e-12 and max(jumps)<1e-12 and balance<1e-12
    lossless=Stack(positions,BETA.real)
    assert abs(abs(lossless.r)**2+abs(lossless.t)**2-1)<1e-12
    return dict(single_t=[one.t.real,one.t.imag],single_reflection=abs(one.r)**2,
                single_phase_rad=float(np.angle(one.t)),single_delay_periods=float(np.angle(one.t)/(2*np.pi)),
                index_phase=float(bloch_index().real),index_imag=float(bloch_index().imag),
                stack_reflection=abs(stack.r)**2,stack_transmission=abs(stack.t)**2,stack_absorption=float(absorption),
                continuity_error=float(max(continuity)),jump_error=float(max(jumps)),energy_balance_error=float(balance))


def style():
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':18,'text.color':S['text'],
        'axes.labelcolor':S['text'],'xtick.color':S['muted'],'ytick.color':S['muted'],
        'axes.edgecolor':S['muted'],'axes.facecolor':S['background'],'figure.facecolor':S['background'],
        'savefig.facecolor':S['background'],'svg.fonttype':'path','mathtext.fontset':'dejavusans'})


def figure():return plt.figure(figsize=(S['width_inches'],S['height_inches']))
def txt(ax,x,y,text,**kwargs):return ax.text(x,y,text,**{'color':S['text'],'fontsize':18,**kwargs})
def arrow(ax,x0,y0,x1,y1,color,**kwargs):
    ax.annotate('',(x1,y1),(x0,y0),arrowprops={'arrowstyle':'-|>','lw':2.5,'color':color,**kwargs})
def axes_style(ax):
    for edge in ['left','right','top']:ax.spines[edge].set_visible(False)
    ax.spines['bottom'].set_color('#4e606d');ax.tick_params(length=5,labelsize=15)
    ax.set_yticks([]);ax.axhline(0,color='#4e606d',lw=1,zorder=0)

def save(fig,name):
    for ext in ['svg','png']:fig.savefig(HERE/f'{name}.{ext}',dpi=S['dpi'],metadata={'Creator':'DN'} if ext=='svg' else {'Software':'NeutrinoHit'})
    plt.close(fig)


def single_figure():
    stack=Stack([0]);phi=float(np.angle(stack.t));delay=phi/K
    fig=figure();scheme=fig.add_axes([.07,.79,.86,.17]);scheme.set(xlim=(0,1),ylim=(0,1));scheme.axis('off')
    scheme.add_patch(Rectangle((.46,.08),.018,.66,facecolor=S['total'],alpha=.8))
    arrow(scheme,.03,.42,.4,.42,S['incident']);arrow(scheme,.54,.42,.86,.42,S['total'])
    txt(scheme,.2,.64,'Падающий свет',ha='center',color=S['incident'],fontsize=18)
    txt(scheme,.47,.91,'Тонкий слой',ha='center',fontsize=20)
    scheme.plot(.91,.42,'o',color=S['text'],ms=8)
    txt(scheme,.91,.65,'P',ha='center',fontsize=20)
    txt(scheme,.73,-.04,'Здесь сравниваем поля',ha='center',fontsize=17,color=S['muted'])
    ax=fig.add_axes([.08,.20,.86,.52]);u=np.linspace(-.025,.60,2001);phase=K*(u-.25);wave=np.exp(-1j*phase)
    incoming=wave.real;secondary=((stack.t-1)*wave).real;total=(stack.t*wave).real
    ax.plot(u,incoming,color=S['incident'],lw=2.8,ls=(0,(7,4)),label='Падающее поле')
    ax.plot(u,secondary,color=S['secondary'],lw=2.8,label='Поле зарядов')
    ax.plot(u,total,color=S['total'],lw=3.4,label='Сумма')
    ax.set(xlim=(u[0],u[-1]),ylim=(-.75,1.62));axes_style(ax)
    ax.set_xticks([0,.1,.2,.3,.4,.5,.6],['0','0,1','0,2','0,3','0,4','0,5','0,6'])
    ax.set_xlabel('Время в точке P, в долях периода T',fontsize=19,labelpad=12)
    p0=.25;p1=p0+delay
    for x,y,color in [(p0,1,S['incident']),(p1,abs(stack.t),S['total'])]:
        ax.plot([x,x],[y,1.37],color=color,lw=1.7,ls=(0,(3,3)));ax.plot(x,y,'o',color=color,ms=7)
    ax.annotate('',(p1,1.35),(p0,1.35),arrowprops={'arrowstyle':'<->','lw':2,'color':S['text'],'shrinkA':0,'shrinkB':0,'mutation_scale':13})
    txt(ax,(p0+p1)/2,1.47,'Максимум суммы позже',ha='center',fontsize=22)
    txt(ax,.39,1.20,f'Δt ≈ {delay:.3f} T'.replace('.',','),color=S['muted'],fontsize=18)
    ax.legend(loc='lower left',ncol=3,bbox_to_anchor=(0,-.36),frameon=False,fontsize=17,handlelength=2.5,columnspacing=2.2)
    save(fig,'one-sheet')
    return dict(peak_in_periods=p0,peak_total_periods=p1)


def peak_positions(stack,phase,start,end):
    grid=np.linspace(start,end,12001);v=stack.real(grid,phase)
    indices=signal.find_peaks(v,height=.5,distance=2000)[0]
    out=[]
    for i in indices:
        opt=optimize.minimize_scalar(lambda z:-float(stack.real(z,phase)),bounds=(grid[max(0,i-2)],grid[min(len(grid)-1,i+2)]),method='bounded',options={'xatol':1e-13})
        out.append(float(opt.x))
    return out


def bulk_figure():
    spacing=P['spacing_lambda0'];length=P['sheets']*spacing;positions=(np.arange(P['sheets'])+.5)*spacing
    stack=Stack(positions);phase=P['snapshot_phase'];n=bloch_index().real
    z=np.linspace(-.55,3.3,10001);vacuum=np.cos(K*z-phase);total=stack.real(z,phase)
    peaks=peak_positions(stack,phase,.05,length-.05)
    fig=figure();ax=fig.add_axes([.06,.25,.90,.63]);ax.set(xlim=(-.55,3.3),ylim=(-1.52,1.70));axes_style(ax)
    ax.axvspan(0,length,color=S['total'],alpha=.075,zorder=-3)
    for boundary in [0,length]:ax.axvline(boundary,color=S['total'],alpha=.6,lw=1.5)
    for plane in positions:ax.plot([plane,plane],[-1.32,-1.25],color=S['total'],alpha=.45,lw=1)
    ax.plot(z,vacuum,color=S['incident'],lw=2.4,ls=(0,(7,4)),label='Без вещества')
    ax.plot(z,total,color=S['total'],lw=3.1,label='Суммарное поле')
    txt(ax,-.28,1.78,'Вакуум',ha='center',fontsize=20,color=S['muted'])
    txt(ax,length/2,1.78,'Вещество',ha='center',fontsize=22)
    txt(ax,2.30,1.78,'Снова вакуум',ha='center',fontsize=20,color=S['muted'])
    # Actual neighbouring maxima of the calculated field in the body.
    if len(peaks)<2:raise RuntimeError(f'Need two interior maxima: {peaks}')
    p0,p1=peaks[:2]
    for p in [p0,p1]:
        ax.plot([p,p],[stack.real(p,phase),1.28],color=S['total'],lw=1.4,ls=(0,(3,3)));ax.plot(p,stack.real(p,phase),'o',color=S['total'],ms=6)
    ax.annotate('',(p1,1.25),(p0,1.25),arrowprops={'arrowstyle':'<->','lw':2,'color':S['total'],'shrinkA':0,'shrinkB':0})
    txt(ax,(p0+p1)/2,1.30,'λ < λ₀',ha='center',va='bottom',color=S['total'],fontsize=22)
    # Both vacuum ruler endpoints are actual maxima of the dashed reference.
    v0=2+phase/K;v1=v0+1
    for x in [v0,v1]:
        ax.plot([x,x],[1,1.28],color=S['incident'],lw=1.4,ls=(0,(3,3)));ax.plot(x,1,'o',color=S['incident'],ms=6)
    ax.annotate('',(v1,1.25),(v0,1.25),arrowprops={'arrowstyle':'<->','lw':2,'color':S['incident'],'shrinkA':0,'shrinkB':0})
    txt(ax,(v0+v1)/2,1.30,'λ₀',ha='center',va='bottom',color=S['incident'],fontsize=23)
    outgoing=v0-np.angle(stack.t)/K
    if not length<outgoing<v0:raise RuntimeError('Choose a snapshot with an unambiguous outgoing crest shift')
    for x,y,color in [(outgoing,abs(stack.t),S['total']),(v0,1,S['incident'])]:
        ax.plot([x,x],[y,-1.10],color=color,lw=1.2,ls=(0,(3,4)),alpha=.55)
        ax.plot(x,y,'o',color=color,ms=6)
    ax.annotate('',(v0,-1.10),(outgoing,-1.10),arrowprops={'arrowstyle':'<->','lw':1.8,'color':S['text'],'shrinkA':0,'shrinkB':0})
    txt(ax,(v0+outgoing)/2,-1.24,'Сдвиг гребня',ha='center',va='top',fontsize=17)
    ax.set_xticks([0,.5,1,1.5,2,2.5,3],['0','0,5','1','1,5','2','2,5','3']);ax.set_xlabel('Расстояние вдоль луча, в долях λ₀',fontsize=19,labelpad=12)
    ax.legend(loc='lower left',ncol=2,bbox_to_anchor=(-.005,-.34),frameon=False,fontsize=17,handlelength=3,columnspacing=3)
    txt(ax,.99,-.27,r'$n=\lambda_0/\lambda>1$',transform=ax.transAxes,ha='right',fontsize=26,color=S['total'])
    fig.text(.06,.96,'Один момент времени · одна шкала расстояний',fontsize=19,color=S['muted'])
    fig.text(.96,.96,'Свет →',ha='right',fontsize=19,color=S['muted'])
    save(fig,'many-sheets')
    return dict(interior_peaks=peaks,peak_wavelength=p1-p0,bloch_wavelength=1/n,thickness=length,
                outgoing_crest=outgoing,vacuum_crest=v0,phase_delay_rad=float(np.angle(stack.t)))


def main():
    style();report=validation();report['single_plot']=single_figure();report['bulk_plot']=bulk_figure()
    (HERE/'calculation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':main()
