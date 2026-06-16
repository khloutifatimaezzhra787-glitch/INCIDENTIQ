import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X, FolderOpen, Pencil, AlertCircle } from 'lucide-react'
import api from '../api/client'

const emptyForm = { nom: '', description: '', parent_id: '' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/categories')
      setCategories(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de charger les categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const parents = useMemo(() => categories.filter(c => !c.parent_id), [categories])
  const childrenByParent = useMemo(() => {
    return categories.reduce((acc, cat) => {
      if (cat.parent_id) acc[cat.parent_id] = [...(acc[cat.parent_id] || []), cat]
      return acc
    }, {})
  }, [categories])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      nom: category.nom || '',
      description: category.description || '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
    })
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nom = form.nom.trim()
    if (!nom) {
      setError('Le nom de la categorie est obligatoire')
      return
    }

    const payload = {
      nom,
      description: form.description.trim() || null,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
    }

    setSubmitting(true)
    setError('')
    try {
      if (editing) await api.put(`/api/categories/${editing.id}`, payload)
      else await api.post('/api/categories', payload)
      closeModal()
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur categorie')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (category) => {
    if (!confirm(`Supprimer la categorie "${category.nom}" ?`)) return
    setError('')
    try {
      await api.delete(`/api/categories/${category.id}`)
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.detail || 'Suppression impossible')
    }
  }

  const inputStyle = {
    padding: '9px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color var(--transition)',
    width: '100%',
  }

  const renderCategory = (cat, nested = false) => (
    <div key={cat.id} className="fade-up" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: nested ? '12px 14px' : '16px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginLeft: nested ? 18 : 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: nested ? 'var(--bg-hover)' : 'var(--green-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: nested ? 'var(--text-muted)' : 'var(--green)',
        flexShrink: 0,
      }}>
        <FolderOpen size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
          {cat.nom}
        </div>
        {cat.description && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {cat.description}
          </div>
        )}
      </div>
      <button onClick={() => openEdit(cat)} title="Modifier" style={{ padding: 6, color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}>
        <Pencil size={14} />
      </button>
      <button onClick={() => handleDelete(cat)} title="Supprimer" style={{ padding: 6, color: 'var(--red)', borderRadius: 'var(--radius-sm)' }}>
        <Trash2 size={14} />
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Categories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{categories.length} categorie{categories.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', background: 'var(--blue)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13,
          boxShadow: '0 4px 12px rgba(15,107,79,0.28)',
        }}>
          <Plus size={15} /> Nouvelle categorie
        </button>
      </div>

      {error && !showModal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {parents.map(parent => (
            <div key={parent.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {renderCategory(parent)}
              {(childrenByParent[parent.id] || []).map(child => renderCategory(child, true))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="fade-up" style={{
            width: '100%', maxWidth: 420,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                {editing ? 'Modifier la categorie' : 'Nouvelle categorie'}
              </h2>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Nom *</label>
                <input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>Categorie parente</label>
                <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Aucune</option>
                  {parents.filter(p => p.id !== editing?.id).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={closeModal} style={{ padding: '9px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Annuler</button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 20px', background: 'var(--blue)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
