import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  BookOpen, ChevronLeft, ChevronRight, CircleUserRound, Dices, Download,
  FileText, Heart, Minus, Plus, RotateCcw, ScrollText, Shield, Sparkles, Swords, Upload, X,
} from 'lucide-react'

type SheetData = Record<string, string | boolean>
type PageId = 'fiche' | 'personnage' | 'sorts' | 'notes'

const pages: { id: PageId; label: string; short: string; icon: typeof Shield }[] = [
  { id: 'fiche', label: 'Fiche principale', short: 'Fiche', icon: Shield },
  { id: 'personnage', label: 'Personnage', short: 'Profil', icon: CircleUserRound },
  { id: 'sorts', label: 'Grimoire', short: 'Sorts', icon: Sparkles },
  { id: 'notes', label: 'Journal & notes', short: 'Notes', icon: BookOpen },
]

const stats = [
  ['FOR', 'Force'], ['DEX', 'Dextérité'], ['CON', 'Constitution'],
  ['INT', 'Intelligence'], ['SAG', 'Sagesse'], ['CHA', 'Charisme'],
]

const skills = [
  'Acrobaties · DEX', 'Arcanes · INT', 'Athlétisme · FOR', 'Discrétion · DEX',
  'Dressage · SAG', 'Escamotage · DEX', 'Histoire · INT', 'Intimidation · CHA',
  'Investigation · INT', 'Médecine · SAG', 'Nature · INT', 'Perception · SAG',
  'Perspicacité · SAG', 'Persuasion · CHA', 'Religion · INT', 'Représentation · CHA',
  'Survie · SAG', 'Tromperie · CHA',
]

function App() {
  const [page, setPage] = useState<PageId>('fiche')
  const [diceOpen, setDiceOpen] = useState(false)
  const [data, setData] = useState<SheetData>(() => {
    try { return JSON.parse(localStorage.getItem('chroniques-sheet') || '{}') } catch { return {} }
  })
  const [notice, setNotice] = useState('Sauvegarde automatique activée')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem('chroniques-sheet', JSON.stringify(data))
    const timer = window.setTimeout(() => setNotice('Toutes les modifications sont enregistrées'), 500)
    return () => window.clearTimeout(timer)
  }, [data])

  const set = (key: string, value: string | boolean) => {
    setNotice('Enregistrement…')
    setData((old) => ({ ...old, [key]: value }))
  }
  const value = (key: string) => String(data[key] ?? '')
  const pageIndex = pages.findIndex((item) => item.id === page)

  const exportSheet = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${value('nom') || 'personnage'}-fiche.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setNotice('Fiche exportée avec succès')
  }

  const importSheet = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
        setData(parsed)
        setNotice('Fiche importée avec succès')
      } catch { setNotice('Ce fichier ne semble pas valide') }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const reset = () => {
    if (window.confirm('Effacer définitivement toute la fiche ?')) {
      setData({})
      setNotice('Nouvelle fiche créée')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('fiche')} aria-label="Retour à la fiche">
          <span className="brand-mark"><Dices size={23} /></span>
          <span><strong>Chroniques</strong><small>Registre des aventuriers · 5e</small></span>
          <span className="brand-sigil">from Ardor521</span>
        </button>

        <nav className="desktop-nav" aria-label="Sections de la fiche">
          {pages.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        <div className="actions">
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={importSheet} hidden />
          <button className="dice-action" onClick={() => setDiceOpen(true)} title="Lancer les dés"><Dices size={19} /><span>Dés</span></button>
          <button className="icon-action danger" onClick={reset} title="Réinitialiser"><RotateCcw size={18} /></button>
          <button className="icon-action" onClick={() => fileRef.current?.click()} title="Importer"><Upload size={18} /></button>
          <button className="primary-action" onClick={exportSheet}><Download size={17} /><span>Exporter</span></button>
        </div>
      </header>

      <main>
        <section className="hero-row">
          <div>
            <p className="eyebrow">{pages[pageIndex].label}</p>
            <h1>{page === 'fiche' ? (value('nom') || 'Votre aventurier') : pages[pageIndex].label}</h1>
            <p className="subtitle">
              {page === 'fiche' ? 'Tout ce dont vous avez besoin, au cœur de l’aventure.' :
               page === 'personnage' ? 'Donnez de la profondeur à votre héros.' :
               page === 'sorts' ? 'Préparez vos incantations et gérez vos emplacements.' :
               'Conservez les indices, quêtes et souvenirs de votre campagne.'}
            </p>
          </div>
          <div className="hero-sigil" aria-hidden="true"><Dices size={44} /><span>◆</span></div>
          <div className="save-state"><span />{notice}</div>
        </section>

        {page === 'fiche' && <MainSheet data={data} set={set} />}
        {page === 'personnage' && <CharacterPage data={data} set={set} />}
        {page === 'sorts' && <SpellsPage data={data} set={set} />}
        {page === 'notes' && <NotesPage data={data} set={set} />}
      </main>

      <div className="page-stepper">
        <button disabled={pageIndex === 0} onClick={() => setPage(pages[pageIndex - 1].id)}><ChevronLeft size={18} /> Précédent</button>
        <span>{pageIndex + 1} / {pages.length}</span>
        <button disabled={pageIndex === pages.length - 1} onClick={() => setPage(pages[pageIndex + 1].id)}>Suivant <ChevronRight size={18} /></button>
      </div>

      {diceOpen && <DiceRoller onClose={() => setDiceOpen(false)} />}

      <nav className="mobile-nav" aria-label="Navigation mobile">
        {pages.map(({ id, short, icon: Icon }) => (
          <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={21} /><span>{short}</span></button>
        ))}
      </nav>
      <footer className="app-footer">
        <span className="footer-sigil">✦ from Ardor521 ✦</span>
      </footer>
    </div>
  )
}

function Field({ data, set, id, label, placeholder, type = 'text' }: {
  data: SheetData; set: (k: string, v: string | boolean) => void; id: string; label?: string; placeholder?: string; type?: string
}) {
  return <label className="field">{label && <span>{label}</span>}<input type={type} value={String(data[id] ?? '')} placeholder={placeholder} onChange={(e) => set(id, e.target.value)} /></label>
}

function Area({ data, set, id, label, placeholder, rows = 4 }: {
  data: SheetData; set: (k: string, v: string | boolean) => void; id: string; label?: string; placeholder?: string; rows?: number
}) {
  return <label className="field area">{label && <span>{label}</span>}<textarea rows={rows} value={String(data[id] ?? '')} placeholder={placeholder} onChange={(e) => set(id, e.target.value)} /></label>
}

function Card({ title, icon, children, className = '' }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}><header className="card-title">{icon}<h2>{title}</h2></header>{children}</section>
}

function CheckRow({ data, set, id, valueId, label }: { data: SheetData; set: (k: string, v: string | boolean) => void; id: string; valueId: string; label: string }) {
  return <div className="check-row"><input aria-label={`Maîtrise ${label}`} type="checkbox" checked={Boolean(data[id])} onChange={(e) => set(id, e.target.checked)} /><input className="bonus" value={String(data[valueId] ?? '')} placeholder="+0" onChange={(e) => set(valueId, e.target.value)} /><span>{label}</span></div>
}

function MainSheet({ data, set }: { data: SheetData; set: (k: string, v: string | boolean) => void }) {
  const hp = Number(data.pv || 0), maxHp = Number(data.pvmax || 0)
  const hpPercent = maxHp > 0 ? Math.min(100, Math.max(0, hp / maxHp * 100)) : 0
  return <div className="sheet-grid">
    <div className="column">
      <Card title="Identité" icon={<ScrollText size={18} />}>
        <Field data={data} set={set} id="nom" label="Nom du personnage" placeholder="Ex. Elara Brumelune" />
        <div className="grid-2"><Field data={data} set={set} id="classe" label="Classe & niveau" placeholder="Rôdeuse · 5" /><Field data={data} set={set} id="race" label="Espèce" placeholder="Elfe des bois" /></div>
        <div className="grid-2"><Field data={data} set={set} id="bg" label="Historique" placeholder="Éclaireuse" /><Field data={data} set={set} id="align" label="Alignement" placeholder="Neutre bon" /></div>
        <div className="grid-2"><Field data={data} set={set} id="joueur" label="Joueur" /><Field data={data} set={set} id="xp" label="Expérience" placeholder="0 XP" /></div>
      </Card>
      <Card title="Caractéristiques" icon={<Swords size={18} />}>
        <div className="stats-grid">{stats.map(([abbr, name], i) => <div className="stat" key={abbr}><span>{abbr}</span><small>{name}</small><input aria-label={`Score de ${name}`} value={String(data['car' + i] ?? '')} placeholder="10" onChange={(e) => set('car' + i, e.target.value)} /><input aria-label={`Modificateur de ${name}`} className="mod" value={String(data['mod' + i] ?? '')} placeholder="+0" onChange={(e) => set('mod' + i, e.target.value)} /></div>)}</div>
      </Card>
      <Card title="Jets de sauvegarde">
        <div className="rows">{stats.map(([abbr, name], i) => <CheckRow key={abbr} data={data} set={set} id={'js' + i} valueId={'jsv' + i} label={`${name} · ${abbr}`} />)}</div>
      </Card>
    </div>

    <div className="column">
      <Card title="Compétences" className="skills-card">
        <div className="rows skill-columns">{skills.map((skill, i) => <CheckRow key={skill} data={data} set={set} id={'sk' + i} valueId={'skv' + i} label={skill} />)}</div>
      </Card>
      <Card title="Sens & connaissances">
        <div className="grid-2"><Field data={data} set={set} id="percp" label="Perception passive" placeholder="10" /><Field data={data} set={set} id="inspiration" label="Inspiration" placeholder="0" /></div>
        <Area data={data} set={set} id="mait" label="Maîtrises & langues" placeholder="Commun, elfique, armures légères…" rows={3} />
      </Card>
    </div>

    <div className="column">
      <Card title="Combat" icon={<Shield size={18} />}>
        <div className="combat-grid"><Field data={data} set={set} id="ca" label="Classe d’armure" placeholder="10" /><Field data={data} set={set} id="init" label="Initiative" placeholder="+0" /><Field data={data} set={set} id="vit" label="Vitesse" placeholder="9 m" /></div>
        <div className="hp-panel"><div className="hp-head"><span><Heart size={17} /> Points de vie</span><strong>{hp || 0} <small>/ {maxHp || '—'}</small></strong></div><div className="hp-track"><i style={{ width: `${hpPercent}%` }} /></div><div className="grid-3"><Field data={data} set={set} id="pvmax" label="Maximum" type="number" /><Field data={data} set={set} id="pv" label="Actuels" type="number" /><Field data={data} set={set} id="pvt" label="Temporaires" type="number" /></div></div>
        <div className="death-saves"><span>Jets contre la mort</span>{['Succès', 'Échecs'].map((group, gi) => <div key={group}><small>{group}</small>{[1, 2, 3].map((n) => <input key={n} aria-label={`${group} ${n}`} type="checkbox" checked={Boolean(data[gi ? `df${n}` : `ds${n}`])} onChange={(e) => set(gi ? `df${n}` : `ds${n}`, e.target.checked)} />)}</div>)}</div>
      </Card>
      <Card title="Attaques & capacités" icon={<Swords size={18} />}><Area data={data} set={set} id="atk" placeholder="Nom, bonus d’attaque, dégâts et type…" rows={5} /></Card>
      <Card title="Équipement"><Area data={data} set={set} id="equip" placeholder="Armes, armures, outils et objets…" rows={4} /><div className="money">{['PC', 'PA', 'PE', 'PO', 'PP'].map((coin, i) => <Field key={coin} data={data} set={set} id={'m' + i} label={coin} placeholder="0" />)}</div></Card>
    </div>
  </div>
}

function CharacterPage({ data, set }: { data: SheetData; set: (k: string, v: string | boolean) => void }) {
  return <div className="content-grid two-one">
    <div className="column"><Card title="Portrait du personnage" icon={<CircleUserRound size={18} />}><Field data={data} set={set} id="nom" label="Nom" /><div className="grid-3"><Field data={data} set={set} id="age" label="Âge" /><Field data={data} set={set} id="tail" label="Taille" /><Field data={data} set={set} id="poid" label="Poids" /></div><div className="grid-3"><Field data={data} set={set} id="yeux" label="Yeux" /><Field data={data} set={set} id="peau" label="Peau" /><Field data={data} set={set} id="chev" label="Cheveux" /></div><Area data={data} set={set} id="app" label="Apparence physique" placeholder="Silhouette, tenue, signes distinctifs…" rows={5} /></Card><Card title="Personnalité"><Area data={data} set={set} id="trait" label="Traits, idéaux, liens & défauts" placeholder="Ce qui rend votre personnage unique…" rows={8} /></Card></div>
    <div className="column"><Card title="Histoire" icon={<BookOpen size={18} />}><Area data={data} set={set} id="hist" placeholder="D’où venez-vous ? Qu’est-ce qui vous pousse sur les routes ?" rows={12} /></Card><Card title="Relations"><Area data={data} set={set} id="allie" label="Alliés & organisations" rows={4} /><Area data={data} set={set} id="ennemis" label="Ennemis & rivaux" rows={4} /></Card><Card title="Trésor & particularités"><Area data={data} set={set} id="tres" label="Trésors" rows={3} /><Area data={data} set={set} id="supp" label="Traits supplémentaires" rows={3} /></Card></div>
  </div>
}

function SpellsPage({ data, set }: { data: SheetData; set: (k: string, v: string | boolean) => void }) {
  return <><Card title="Aptitude magique" icon={<Sparkles size={18} />} className="magic-header"><div className="magic-fields"><Field data={data} set={set} id="clasort" label="Classe de lanceur" /><Field data={data} set={set} id="caraso" label="Caractéristique" /><Field data={data} set={set} id="dd" label="DD de sauvegarde" /><Field data={data} set={set} id="bonat" label="Bonus d’attaque" /></div></Card><div className="spell-grid">{Array.from({ length: 10 }, (_, level) => <Card key={level} title={level === 0 ? 'Tours de magie' : `Niveau ${level}`} className="spell-card">{level > 0 && <div className="slots"><span>Emplacements</span><Field data={data} set={set} id={`sl${level}u`} label="Utilisés" placeholder="0" /><b>/</b><Field data={data} set={set} id={`sl${level}`} label="Total" placeholder="0" /></div>}<Area data={data} set={set} id={`sort${level}`} placeholder={level === 0 ? 'Rayon de givre…' : 'Nom du sort — préparation, composantes…'} rows={5} /></Card>)}</div></>
}

function NotesPage({ data, set }: { data: SheetData; set: (k: string, v: string | boolean) => void }) {
  return <div className="notes-layout"><Card title="Journal de campagne" icon={<FileText size={18} />} className="journal"><Field data={data} set={set} id="noteTitle" label="Titre de la session" placeholder="La crypte sous la lune…" /><Field data={data} set={set} id="noteDate" label="Date en jeu" placeholder="14e jour de Hautzénith" /><Area data={data} set={set} id="notes" label="Notes" placeholder="Écrivez ici. Indices, rencontres, décisions importantes…" rows={24} /></Card><aside><Card title="Quêtes"><Area data={data} set={set} id="quetes" placeholder="Objectifs en cours…" rows={8} /></Card><Card title="Personnages rencontrés"><Area data={data} set={set} id="pnj" placeholder="Noms, rôles, impressions…" rows={8} /></Card><Card title="Lieux & indices"><Area data={data} set={set} id="indices" placeholder="Détails à ne pas oublier…" rows={8} /></Card></aside></div>
}

const diceTypes = [2, 4, 6, 8, 10, 12, 20, 100]

function DiceRoller({ onClose }: { onClose: () => void }) {
  const [sides, setSides] = useState(20)
  const [quantity, setQuantity] = useState(1)
  const [results, setResults] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [rollId, setRollId] = useState(0)
  const [history, setHistory] = useState<{ label: string; total: number; rolls: number[] }[]>([])

  const roll = () => {
    if (rolling) return
    setRolling(true)
    setRollId((id) => id + 1)
    setResults([])
    window.setTimeout(() => {
      const next = Array.from({ length: quantity }, () => Math.floor(Math.random() * sides) + 1)
      const total = next.reduce((sum, result) => sum + result, 0)
      setResults(next)
      setHistory((old) => [{ label: `${quantity}d${sides}`, total, rolls: next }, ...old].slice(0, 4))
      setRolling(false)
    }, 1100)
  }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const displayedDice = rolling ? Array.from({ length: quantity }, (_, i) => ((i * 7 + sides) % sides) + 1) : results
  const total = results.reduce((sum, result) => sum + result, 0)

  return <div className="dice-overlay" role="dialog" aria-modal="true" aria-label="Lanceur de dés" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <section className="dice-panel">
      <header className="dice-header">
        <div className="dice-emblem"><Dices size={25} /></div>
        <div><p>L’antre du hasard</p><h2>Lanceur de dés</h2></div>
        <button onClick={onClose} aria-label="Fermer"><X size={21} /></button>
      </header>

      <div className="dice-body">
        <div className="dice-config">
          <span className="config-label">Choisissez votre dé</span>
          <div className="dice-types">{diceTypes.map((die) => <button key={die} className={sides === die ? 'active' : ''} onClick={() => { setSides(die); setResults([]) }}><Dices size={16} /><span>d{die}</span></button>)}</div>
          <div className="quantity-row">
            <div><span className="config-label">Nombre de dés</span><small>Jusqu’à 20 dés simultanément</small></div>
            <div className="quantity-control"><button onClick={() => setQuantity((n) => Math.max(1, n - 1))} disabled={quantity === 1}><Minus size={17} /></button><strong>{quantity}</strong><button onClick={() => setQuantity((n) => Math.min(20, n + 1))} disabled={quantity === 20}><Plus size={17} /></button></div>
          </div>
        </div>

        <div className={`dice-arena ${rolling ? 'is-rolling' : ''}`}>
          {displayedDice.length === 0 && <div className="empty-roll"><Dices size={49} /><p>Les dés attendent votre appel…</p><small>Sélectionnez un dé, puis tentez votre chance.</small></div>}
          {displayedDice.length > 0 && <div className="dice-stage" key={rollId}>{displayedDice.map((result, index) => <div className="die-wrap" key={`${rollId}-${index}`} style={{ animationDelay: `${index * 45}ms` }}><div className="die-3d"><span className="face front">{rolling ? '?' : result}</span><span className="face back">{Math.max(1, sides - result + 1)}</span><span className="face right">{Math.min(sides, result + 1)}</span><span className="face left">{Math.max(1, result - 1)}</span><span className="face top">{Math.max(1, Math.ceil(sides / 2))}</span><span className="face bottom">{sides}</span></div><small>d{sides}</small></div>)}</div>}
          {!rolling && results.length > 0 && <div className="roll-total"><span>Total</span><strong>{total}</strong>{results.length > 1 && <small>{results.join(' + ')}</small>}</div>}
        </div>

        <button className="roll-button" onClick={roll} disabled={rolling}><Dices size={22} /><span>{rolling ? 'Les dés roulent…' : `Lancer ${quantity}d${sides}`}</span></button>
        {history.length > 0 && <div className="roll-history"><span>Derniers lancers</span>{history.map((item, i) => <div key={`${item.label}-${i}`}><b>{item.label}</b><small>{item.rolls.join(', ')}</small><strong>{item.total}</strong></div>)}</div>}
      </div>
    </section>
  </div>
}

export default App
