import React, { useEffect, useState } from 'react'
import { Plus, Download, X, FileText, FileSpreadsheet, File, Trash2 } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDateTime, formatFileSize } from '../utils/helpers'

const TYPES = ['journalier', 'hebdomadaire', 'mensuel', 'personnalise']
const FORMATS = ['pdf', 'excel', 'csv']
const STATUTS = ['', 'en_attente', 'ouvert', 'en_cours', 'resolu', 'ferme', 'annule']
const PRIORITES = ['', 'faible', 'moyenne', 'haute', 'critique']

const fmtIcon = { pdf: <File size={16} />, excel: <FileSpreadsheet size={16} />, csv: <FileText size={16} /> }
const fmtColor = { pdf: '#ef4444', excel: '#22c55e', csv: '#3b82f6' }
const fmtBg = { pdf: '#fef2f2', excel: '#f0fdf4', csv: '#eff6ff' }

export default function Rapports() {
  const { user } = useAuth()
  const [rapports, setRapports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [techniciens, setTechniciens] = useState([])
  const [incidents, setIncidents] = useState([])
  const [generating, setGenerating] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [form, setForm] = useState({
    titre: '', type: 'mensuel', format: 'pdf', incident_id: '',
    date_debut: '', date_fin: '', statut_filtre: '',
    priorite_filtre: '', categorie_id: '', assigne_id: '', notes_technicien: ''
  })

  const fetchRapports = () => {
    api.get('/api/rapports').then(r => setRapports(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRapports()
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {})
    api.get('/api/users/techniciens').then(r => setTechniciens(r.data)).catch(() => {})
    api.get('/api/incidents/?limit=200').then(r => setIncidents(r.data.items || [])).catch(() => {})
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    const payload = { ...form }
    if (!payload.date_debut) delete payload.date_debut
    if (!payload.date_fin) delete payload.date_fin
    if (!payload.statut_filtre) delete payload.statut_filtre
    if (!payload.priorite_filtre) delete payload.priorite_filtre
    if (!payload.notes_technicien?.trim()) delete payload.notes_technicien
    else payload.notes_technicien = payload.notes_technicien.trim()
    if (!payload.incident_id) delete payload.incident_id
    else payload.incident_id = parseInt(payload.incident_id)
    if (!payload.categorie_id) delete payload.categorie_id
    else payload.categorie_id = parseInt(payload.categorie_id)
    if (!payload.assigne_id) delete payload.assigne_id
    else payload.assigne_id = parseInt(payload.assigne_id)
    try {
      await api.post('/api/rapports/', payload)
      setShowModal(false)
      setNoteSaved(false)
      setForm({ titre: '', type: 'mensuel', format: 'pdf', incident_id: '', date_debut: '', date_fin: '', statut_filtre: '', priorite_filtre: '', categorie_id: '', assigne_id: '', notes_technicien: '' })
      fetchRapports()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur')
    } finally {
      setGenerating(false)
    }
  }

  const handleIncidentChange = (incidentId) => {
    const selectedIncident = incidents.find(i => String(i.id) === incidentId)
    setForm(f => ({
      ...f,
      incident_id: incidentId,
      notes_technicien: selectedIncident?.notes_technicien || '',
    }))
    setNoteSaved(false)
  }

  const saveTechnicianNote = async () => {
    if (!form.incident_id) {
      alert('Choisissez un incident avant d enregistrer la note')
      return
    }
    setSavingNote(true)
    try {
      const res = await api.put(`/api/incidents/${form.incident_id}`, {
        notes_technicien: form.notes_technicien,
      })
      setIncidents(prev => prev.map(i => i.id === res.data.id ? { ...i, notes_technicien: res.data.notes_technicien } : i))
      setForm(f => ({ ...f, notes_technicien: res.data.notes_technicien || '' }))
      setNoteSaved(true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur enregistrement note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDownload = async (r) => {
    try {
      const res = await api.get(`/api/rapports/${r.id}/telecharger`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${r.titre}.${r.format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erreur téléchargement')
    }
  }

  const handleDelete = async (rapportId) => {
    if (!window.confirm('Supprimer ce rapport définitivement ?')) return
    try {
      await api.delete(`/api/rapports/${rapportId}`)
      fetchRapports()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur suppression rapport')
    }
  }

  const inputStyle = {
    padding: '9px 12px', background: 'var(--bg-input)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    transition: 'border-color var(--transition)', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Rapports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{rapports.length} rapport{rapports.length > 1 ? 's' : ''}</p>
        </div>
        {user?.role !== 'client' && <button onClick={() => {
          setNoteSaved(false)
          setShowModal(true)
        }} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', background: 'var(--blue)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13,
          boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          transition: 'background var(--transition)', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
        >
          <Plus size={15} /> Générer un rapport
        </button>}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : rapports.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--bg-card)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 13,
        }}>
          Aucun rapport généré
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {rapports.map((r, idx) => (
            <div key={r.id} className="fade-up" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'box-shadow var(--transition), transform var(--transition)',
              animationDelay: `${idx * 0.04}s`,
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--radius-md)',
                  background: fmtBg[r.format],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: fmtColor[r.format], flexShrink: 0,
                }}>
                  {fmtIcon[r.format]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.titre}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {r.type} · {r.format.toUpperCase()}
                    {r.taille ? ` · ${formatFileSize(r.taille)}` : ''}
                  </div>
                  {r.notes_technicien && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.45 }}>
                      {r.notes_technicien}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(r.created_at)}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleDownload(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--blue-soft)', color: 'var(--blue)',
                    fontSize: 11, fontWeight: 600, transition: 'all var(--transition)',
                    border: 'none', cursor: 'pointer'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-soft)'; e.currentTarget.style.color = 'var(--blue)' }}
                  >
                    <Download size={12} /> Télécharger
                  </button>
                  {(user?.role === 'admin' || (user?.role === 'technicien' && r.genere_par === user?.id)) && (
                    <button onClick={() => handleDelete(r.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                      background: '#fef2f2', color: '#ef4444',
                      fontSize: 11, fontWeight: 600, transition: 'all var(--transition)',
                      border: 'none', cursor: 'pointer'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="fade-up" style={{
            width: '100%', maxWidth: 500,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Générer un rapport</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleGenerate} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Titre *</label>
                <input required value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex: Rapport mensuel Mai 2026" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
                  Incident {user?.role === 'technicien' ? '*' : ''}
                </label>
                <select required={user?.role === 'technicien'} value={form.incident_id} onChange={e => handleIncidentChange(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Tous les incidents</option>
                  {incidents.map(i => <option key={i.id} value={i.id}>#{i.id} - {i.titre}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Format</label>
                  <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              {user?.role === 'technicien' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Notes pour l'admin</label>
                  <textarea
                    value={form.notes_technicien}
                    onChange={e => {
                      setForm(f => ({ ...f, notes_technicien: e.target.value }))
                      setNoteSaved(false)
                    }}
                    placeholder="Ajoutez vos remarques, les actions realisees ou les points a verifier."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.5 }}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={saveTechnicianNote} disabled={savingNote || !form.incident_id} style={{
                      padding: '8px 13px',
                      background: savingNote || !form.incident_id ? 'var(--border)' : 'var(--blue)',
                      color: '#fff',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: savingNote || !form.incident_id ? 'not-allowed' : 'pointer',
                    }}>
                      {savingNote ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    {noteSaved && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Note enregistree</span>}
                  </div>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Filtres optionnels
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Date début</label>
                    <input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Date fin</label>
                    <input type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Statut</label>
                    <select value={form.statut_filtre} onChange={e => setForm(f => ({ ...f, statut_filtre: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {STATUTS.map(s => <option key={s} value={s}>{s || 'Tous'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Priorité</label>
                    <select value={form.priorite_filtre} onChange={e => setForm(f => ({ ...f, priorite_filtre: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {PRIORITES.map(p => <option key={p} value={p}>{p || 'Toutes'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Catégorie</label>
                    <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Toutes</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Technicien</label>
                    <select value={form.assigne_id} onChange={e => setForm(f => ({ ...f, assigne_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Tous</option>
                      {techniciens.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '9px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600,
                }}>Annuler</button>
                <button type="submit" disabled={generating} style={{
                  padding: '9px 20px', background: 'var(--blue)', color: '#fff',
                  borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                  opacity: generating ? 0.7 : 1, transition: 'all var(--transition)',
                }}>
                  {generating ? 'Génération...' : 'Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
