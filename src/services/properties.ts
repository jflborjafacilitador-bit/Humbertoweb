import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore"
import { db } from "../firebase/config"

export interface Property {
  id?: string
  name: string
  price: string
  location: string
  type: "En Venta" | "En Renta"
  beds: number
  baths: number
  area: string
  image: string
  destacada: boolean
  createdAt?: unknown
}

const COL = "propiedades"

export async function addProperty(data: Omit<Property, "id" | "createdAt">) {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() })
}

export async function updateProperty(id: string, data: Partial<Property>) {
  return updateDoc(doc(db, COL, id), data)
}

export async function deleteProperty(id: string) {
  return deleteDoc(doc(db, COL, id))
}

export async function getProperties(): Promise<Property[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("createdAt", "desc")))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Property))
}

export function subscribeProperties(cb: (props: Property[]) => void) {
  return onSnapshot(query(collection(db, COL), orderBy("createdAt", "desc")), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Property)))
  })
}
