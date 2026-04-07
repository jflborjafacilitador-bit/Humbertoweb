import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export interface LeadData {
  nombre: string
  email: string
  telefono: string
  tipo?: string
  presupuesto?: string
  mensaje?: string
}

/**
 * Guarda un lead en Firestore bajo la colección "leads"
 */
export async function saveLead(data: LeadData): Promise<string> {
  const payload = {
    ...data,
    fuente: 'web',
    estado: 'nuevo',
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'leads'), payload)
  console.log('Lead guardado con ID:', docRef.id)
  return docRef.id
}
