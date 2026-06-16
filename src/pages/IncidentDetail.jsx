import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, User, Tag, AlertTriangle, Download, Trash2, Image, FileText, FilePlus, Eye } from 'lucide-react'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { formatDateTime } from '../utils/helpers'

const STATUTS = ['en_attente', 'ouvert', 'en_cours', 'resolu', 'ferme', 'annule']

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [incident, setIncident] = useState(null)
  const [piecesJointes, setPiecesJointes] = useState([])
  const [rapports, setRapports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pieces_jointes')
  const [techniciens, setTechniciens] = useState([])
  const [generatingReport, setGeneratingReport] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [reportNotes, setReportNotes] = useState('')
  
  // Confirmation states
  const [showConfirm, setShowConfirm] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)

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

  const fetchAll = async () => {
    try {
      const [incRes, piecesRes, rapportsRes] = await Promise.all([
        api.get(`/api/incidents/${id}`),
        api.get(`/api/incidents/${id}/pieces-jointes`),
        api.get(`/api/rapports/incident/${id}`),
      ])
      setIncident(incRes.data)
      setReportNotes(incRes.data.notes_technicien || '')
      setNoteSaved(false)
      setPiecesJointes(piecesRes.data || [])
      setRapports(rapportsRes.data || [])
    } catch {
      navigate('/incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    api.get('/api/users/techniciens').then(r => setTechniciens(r.data)).catch(() => {})
  }, [id])

  const updateField = async (field, value) => {
    setShowConfirm({
      type: 'update',
      field,
      value,
      title: `Modifier le ${field.replace('_', ' ')} ?`,
      message: `Êtes-vous sûr de vouloir modifier cet incident ?`
    })
  }

  const saveTechnicianNote = async () => {
    setSavingNote(true)
    try {
      const res = await api.put(`/api/incidents/${id}`, {
        notes_technicien: reportNotes,
      })
      setIncident(res.data)
      setReportNotes(res.data.notes_technicien || '')
      setNoteSaved(true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur enregistrement note')
    } finally {
      setSavingNote(false)
    }
  }

  const generateReport = async () => {
    setGeneratingReport(true)
    try {
      await api.post('/api/rapports/', {
        titre: incident.titre,
        type: 'personnalise',
        format: 'pdf',
        incident_id: parseInt(id),
        notes_technicien: reportNotes,
      })
      await fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur generation rapport')
    } finally {
      setGeneratingReport(false)
    }
  }

  const publishReport = async (rapportId) => {
    setShowConfirm({
      type: 'publishReport',
      rapportId,
      title: 'Publier ce rapport ?',
      message: 'Ce rapport sera visible par le client. Êtes-vous sûr de vouloir continuer ?'
    })
  }

  const deleteReport = async (rapportId) => {
    setShowConfirm({
      type: 'deleteReport',
      rapportId,
      title: 'Supprimer ce rapport ?',
      message: 'Cette action est irréversible.',
      danger: true
    })
  }

  const deletePieceJointe = async (pieceId) => {
    setShowConfirm({
      type: 'deletePiece',
      pieceId,
      title: 'Supprimer cette pièce jointe ?',
      message: 'Cette action est irréversible.',
      danger: true
    })
  }

  const handleConfirmAction = async () => {
    const confirmType = showConfirm?.type
    
    setIsConfirming(true)
    try {
      if (confirmType === 'update') {
        const payload = { [showConfirm.field]: showConfirm.value }
        const res = await api.put(`/api/incidents/${id}`, payload)
        setIncident(res.data)
      } else if (confirmType === 'publishReport') {
        await api.put(`/api/rapports/${showConfirm.rapportId}/publier`)
        await fetchAll()
      } else if (confirmType === 'deleteReport') {
        await api.delete(`/api/rapports/${showConfirm.rapportId}`)
        await fetchAll()
      } else if (confirmType === 'deletePiece') {
        await api.delete(`/api/incidents/${id}/pieces-jointes/${showConfirm.pieceId}`)
        setPiecesJointes(prev => prev.filter(p => p.id !== showConfirm.pieceId))
      }
      
      setShowConfirm(null)
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de l\'action')
    } finally {
      setIsConfirming(false)
    }
  }

  const downloadReport = async (rapport) => {
    try {
      const res = await api.get(`/api/rapports/${rapport.id}/telecharger`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${rapport.titre}.${rapport.format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.response?.data?.detail || 'Telechargement impossible')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  )

  if (!incident) return null

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }

  const infoItems = [
    { icon: <User size={13} />, label: 'Declare par', value: incident.declarant ? `${incident.declarant.prenom} ${incident.declarant.nom}` : '-' },
    { icon: <User size={13} />, label: 'Technicien', value: incident.assigne ? `${incident.assigne.prenom} ${incident.assigne.nom}` : 'Non assigne' },
    { icon: <Tag size={13} />, label: 'Categorie', value: incident.categorie?.nom || '-' },
    { icon: <Clock size={13} />, label: 'Cree le', value: formatDateTime(incident.created_at) },
    { icon: <Clock size={13} />, label: 'Mis a jour', value: formatDateTime(incident.updated_at) },
    ...(incident.deadline ? [{ icon: <AlertTriangle size={13} />, label: 'Deadline', value: formatDateTime(incident.deadline) }] : []),
    ...(incident.resolved_at ? [{ icon: <Clock size={13} />, label: 'Resolu le', value: formatDateTime(incident.resolved_at) }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => navigate('/incidents')} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: 'var(--text-secondary)',
        background: 'transparent',
        alignSelf: 'flex-start',
      }}>
        <ArrowLeft size={15} /> Retour
      </button>

      <div style={cardStyle}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
                INCIDENT #{incident.id}
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                {incident.titre}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              <Badge statut={incident.statut} />
              <Badge priorite={incident.priorite} />
            </div>
          </div>
          {incident.description && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-hover)',
              borderLeft: '3px solid var(--blue)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              {incident.description}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {infoItems.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}:</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {user?.role !== 'client' && (
        <div style={{ ...cardStyle, padding: '16px 20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-primary)' }}>
            Actions
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {user?.role === 'admin' && (
              <>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                    Statut
                  </label>
                  <select value={incident.statut} onChange={e => updateField('statut', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                    Assigner a
                  </label>
                  <select value={incident.assigne_id || ''} onChange={e => updateField('assigne_id', e.target.value ? parseInt(e.target.value) : null)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Non assigne</option>
                    {techniciens.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
                  </select>
                </div>
                {incident.notes_technicien && (
                  <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Notes du technicien
                    </span>
                    <div style={{
                      padding: '10px 12px',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                    }}>
                      {incident.notes_technicien}
                    </div>
                  </div>
                )}
              </>
            )}
            {user?.role === 'technicien' && (
              <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notes pour l'admin
                </label>
                <textarea
                  value={reportNotes}
                  onChange={e => {
                    setReportNotes(e.target.value)
                    setNoteSaved(false)
                  }}
                  placeholder="Ajoutez vos remarques, les actions realisees ou les points a verifier."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 86, lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={saveTechnicianNote} disabled={savingNote} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '9px 14px',
                    background: savingNote ? 'var(--border)' : 'var(--blue)',
                    color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: savingNote ? 'not-allowed' : 'pointer',
                  }}>
                    {savingNote ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={generateReport} disabled={generatingReport} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '9px 14px',
                    background: generatingReport ? 'var(--border)' : 'var(--green)',
                    color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: generatingReport ? 'not-allowed' : 'pointer',
                  }}>
                    <FilePlus size={15} /> {generatingReport ? 'Generation...' : 'Generer rapport'}
                  </button>
                  {noteSaved && (
                    <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Note enregistree</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {[
            ['pieces_jointes', `Pieces jointes (${piecesJointes.length})`],
            ['rapports', `Rapports (${rapports.length})`],
            ['historique', 'Historique'],
          ].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 20px',
              background: 'transparent',
              whiteSpace: 'nowrap',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? 'var(--blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--blue)' : '2px solid transparent',
            }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {activeTab === 'pieces_jointes' && (
            piecesJointes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Image size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Aucune piece jointe</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {piecesJointes.map(piece => (
                  <div key={piece.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-hover)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 92, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                      {piece.type_mime?.startsWith('image/') ? <img src={`/uploads/${piece.chemin}`} alt={piece.nom_fichier} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : <FileText size={30} />}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{piece.nom_fichier}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <a href={`/uploads/${piece.chemin}`} download={piece.nom_fichier} style={{ padding: '6px 9px', borderRadius: 'var(--radius-md)', background: 'var(--blue)', color: '#fff', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>
                        <Download size={10} /> Telecharger
                      </a>
                      {(user?.role === 'admin' || user?.id === piece.uploade_par) && (
                        <button onClick={() => deletePieceJointe(piece.id)} style={{ padding: '6px 9px', borderRadius: 'var(--radius-md)', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 600 }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'rapports' && (
            rapports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Aucun rapport disponible</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rapports.map(rapport => (
                  <div key={rapport.id} style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-hover)', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{rapport.titre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {rapport.format?.toUpperCase()} - {formatDateTime(rapport.created_at)} - {rapport.publie_client ? 'Publie client' : 'Prive admin/technicien'}
                      </div>
                      {rapport.notes_technicien && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5, maxWidth: 620 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Notes technicien:</strong> {rapport.notes_technicien}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => downloadReport(rapport)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--blue)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        <Download size={13} /> Telecharger
                      </button>
                      {user?.role === 'admin' && !rapport.publie_client && (
                        <button onClick={() => publishReport(rapport.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--green)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          <Eye size={13} /> Publier client
                        </button>
                      )}
                      {(user?.role === 'admin' || (user?.role === 'technicien' && rapport.genere_par === user?.id)) && (
                        <button onClick={() => deleteReport(rapport.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={13} /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'historique' && (
            !incident.historique || incident.historique.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Aucun changement de statut
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incident.historique.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-hover)', flexWrap: 'wrap' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{h.ancien_statut}</strong>
                      {' -> '}
                      <strong style={{ color: 'var(--text-primary)' }}>{h.nouveau_statut}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(h.created_at)}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!showConfirm}
        title={showConfirm?.title || ''}
        message={showConfirm?.message || ''}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setShowConfirm(null)
        }}
        danger={showConfirm?.danger || false}
        confirmText={showConfirm?.type === 'publishReport' ? 'Publier' : showConfirm?.type === 'deletePiece' || showConfirm?.type === 'deleteReport' ? 'Supprimer' : 'Modifier'}
        isLoading={isConfirming}
      />
    </div>
  )
}

