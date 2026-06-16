import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Filter, Upload, Trash2, FileText } from 'lucide-react'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/helpers'

const STATUTS = ['', 'en_attente', 'ouvert', 'en_cours', 'resolu', 'ferme', 'annule']
const PRIORITES = ['', 'faible', 'moyenne', 'haute', 'critique']

const inputStyle = {
  padding: '9px 12px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 13, outline: 'none',
  transition: 'border-color var(--transition)',
  width: '100%',
}

export default function Incidents() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [priorite, setPriorite] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showConfirmCreate, setShowConfirmCreate] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesError, setCategoriesError] = useState('')
  const [techniciens, setTechniciens] = useState([])
  const [form, setForm] = useState({ titre: '', description: '', priorite: 'moyenne', categorie_id: '', assigne_id: '', deadline: '' })
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const navigate = useNavigate()

  const fetchIncidents = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (statut) p.append('statut', statut)
    if (priorite) p.append('priorite', priorite)
    p.append('limit', '100')
    api.get(`/api/incidents/?${p}`)
      .then(r => { setIncidents(r.data.items || []); setTotal(r.data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchIncidents() }, [statut, priorite])
  useEffect(() => {
    api.get('/api/categories/')
      .then(r => {
        setCategories(r.data || [])
        setCategoriesError('')
      })
      .catch(err => {
        setCategories([])
        setCategoriesError(err.response?.data?.detail || 'Impossible de charger les categories')
      })
    api.get('/api/users/techniciens').then(r => setTechniciens(r.data)).catch(() => {})
  }, [])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z']
    const validFiles = selectedFiles.filter(f => {
      const extension = f.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(extension)) {
        alert(`${f.name} n'est pas un format autorise`)
        return false
      }
      if (f.size > 20 * 1024 * 1024) {
        alert(`${f.name} depasse 20MB`)
        return false
      }
      return true
    })
    setFiles(prev => [...prev, ...validFiles])
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setFilePreviews(prev => [...prev, { name: file.name, preview: event.target.result, isImage: true }])
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreviews(prev => [...prev, { name: file.name, preview: null, isImage: false }])
      }
    })
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setShowConfirmCreate(true)
  }

  const confirmCreate = async () => {
    setSubmitting(true)
    const payload = { ...form }
    if (!payload.categorie_id) delete payload.categorie_id
    if (!payload.assigne_id) delete payload.assigne_id
    if (!payload.deadline) delete payload.deadline
    else payload.deadline = new Date(payload.deadline).toISOString()
    try {
      const response = await api.post('/api/incidents/', payload)
      const incidentId = response.data.id
      
      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          try {
            await api.post(`/api/incidents/${incidentId}/upload`, formData)
          } catch (err) {
            console.error(`Erreur upload ${file.name}:`, err)
          }
        }
      }
      
      setShowModal(false)
      setShowConfirmCreate(false)
      setForm({ titre: '', description: '', priorite: 'moyenne', categorie_id: '', assigne_id: '', deadline: '' })
      setFiles([])
      setFilePreviews([])
      fetchIncidents()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = incidents.filter(i =>
    i.titre.toLowerCase().includes(search.toLowerCase())
  )

  const parentCategories = categories.filter(c => !c.parent_id)
  const getSubcategories = (parentId) => categories.filter(c => c.parent_id === parentId)

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Incidents
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
            {search ? `${filtered.length} trouvé(s) sur ${total}` : `${total} au total`}
          </p>
        </div>
        {user?.role === 'client' && <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', background: 'var(--blue)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13,
          boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          transition: 'all var(--transition)', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
        >
          <Plus size={15} /> Nouvel incident
        </button>}
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{ ...inputStyle, paddingLeft: 30 }}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <select value={statut} onChange={e => setStatut(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 130, cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        >
          {STATUTS.map(s => <option key={s} value={s}>{s || 'Tous statuts'}</option>)}
        </select>
        <select value={priorite} onChange={e => setPriorite(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 140, cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        >
          {PRIORITES.map(p => <option key={p} value={p}>{p || 'Toutes priorités'}</option>)}
        </select>
        {(statut || priorite || search) && (
          <button onClick={() => { setStatut(''); setPriorite(''); setSearch('') }} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '9px 12px', background: 'var(--bg-hover)',
            borderRadius: 'var(--radius-md)', fontSize: 12,
            color: 'var(--text-secondary)', flexShrink: 0,
          }}>
            <X size={13} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['N°', 'Titre', 'Catégorie', 'Statut', 'Priorité', 'Assigné', 'Date'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} style={{ padding: '12px 16px' }}>
                      <div className="skeleton" style={{ height: 14, width: j === 1 ? 160 : 70, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              )) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Aucun incident trouvé
                  </td>
                </tr>
              ) : filtered.map((inc, idx) => (
                <tr key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="fade-up"
                  style={{
                    borderTop: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background var(--transition)',
                    animationDelay: `${idx * 0.03}s`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>#{inc.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.titre}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{inc.categorie?.nom || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge statut={inc.statut} /></td>
                  <td style={{ padding: '12px 16px' }}><Badge priorite={inc.priorite} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {inc.assigne ? `${inc.assigne.prenom} ${inc.assigne.nom}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(inc.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="fade-up" style={{
            width: '100%', maxWidth: 500,
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                Nouvel incident
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Titre *</label>
                <input required value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="Description courte de l'incident"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Décrivez l'incident..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Priorité</label>
                  <select value={form.priorite} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {PRIORITES.filter(Boolean).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Catégorie</label>
                  <select value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">{categoriesError ? categoriesError : 'Choisir une categorie'}</option>
                    {!categoriesError && categories.length === 0 && (
                      <option value="" disabled>Aucune categorie disponible</option>
                    )}
                    {parentCategories.map(parent => (
                      <optgroup key={parent.id} label={parent.nom}>
                        <option value={parent.id}>{parent.nom} (Général)</option>
                        {getSubcategories(parent.id).map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.nom}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Deadline</label>
                  <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Pièces jointes</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  background: 'var(--bg-hover)',
                }} 
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <input type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z" onChange={handleFileSelect}
                    style={{ display: 'none' }} id="file-input"
                  />
                  <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Upload size={20} style={{ color: 'var(--blue)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cliquez pour selectionner des fichiers (max 20MB par fichier)</span>
                  </label>
                </div>
                {filePreviews.length > 0 && (
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                    {filePreviews.map((preview, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {preview.isImage ? (
                          <img src={preview.preview} alt={preview.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)' }}>
                            <FileText size={28} style={{ color: 'var(--blue)' }} />
                          </div>
                        )}
                        <button type="button" onClick={() => removeFile(idx)} style={{
                          position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff',
                          border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <X size={14} />
                        </button>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preview.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '9px 16px', background: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-md)', fontSize: 13,
                  color: 'var(--text-secondary)', fontWeight: 600,
                }}>
                  Annuler
                </button>
                <button type="submit" disabled={submitting} style={{
                  padding: '9px 20px', background: 'var(--blue)', color: '#fff',
                  borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                  transition: 'all var(--transition)',
                  opacity: submitting ? 0.7 : 1,
                }}>
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmCreate}
        title="Créer un nouvel incident ?"
        message={`Vous êtes sur le point de créer un incident intitulé "${form.titre}". Êtes-vous sûr de vouloir continuer ?`}
        onConfirm={confirmCreate}
        onCancel={() => setShowConfirmCreate(false)}
        confirmText="Créer"
        isLoading={submitting}
      />
    </div>
  )
}
