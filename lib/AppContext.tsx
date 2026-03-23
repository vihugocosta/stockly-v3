'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Tool, Movement, Competency, AdminRequest, ActiveLoan } from './types';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from './firestore-error';
import Login from '@/components/Login';

interface AppContextType {
  user: User | null;
  userRole: 'admin' | 'user';
  employees: Employee[];
  tools: Tool[];
  movements: Movement[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, emp: Omit<Employee, 'id'>) => void;
  removeEmployee: (id: string) => void;
  addTool: (tool: Omit<Tool, 'id' | 'availableQuantity'>) => void;
  updateTool: (id: string, tool: Omit<Tool, 'id' | 'availableQuantity'>) => void;
  removeTool: (id: string) => void;
  recordMovement: (movement: Omit<Movement, 'id' | 'date'>) => Promise<{ success: boolean; message: string }>;
  adminRequests: AdminRequest[];
  activeLoans: ActiveLoan[];
  requestAdminAccess: () => Promise<{ success: boolean; message: string }>;
  approveAdminRequest: (requestId: string, userId: string) => Promise<{ success: boolean; message: string }>;
  rejectAdminRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  resetDatabase: () => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role as 'admin' | 'user' || 'user');
        } else {
          // Se for o primeiro usuário (victorhugocosta02@gmail.com), define como admin, senão user
          const isFirstAdmin = user.email === 'victorhugocosta02@gmail.com';
          const defaultRole = isFirstAdmin ? 'admin' : 'user';
          
          await setDoc(userDocRef, {
            email: user.email || 'unknown@example.com',
            role: defaultRole
          });
          setUserRole(defaultRole);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'employees'));

    const unsubTools = onSnapshot(collection(db, 'tools'), (snapshot) => {
      setTools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tools'));

    const qMovements = query(collection(db, 'movements'), orderBy('date', 'desc'));
    const unsubMovements = onSnapshot(qMovements, (snapshot) => {
      setMovements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'movements'));

    // Admin Requests listener
    let unsubAdminRequests: () => void = () => {};
    if (userRole === 'admin') {
      const qAdminRequests = query(collection(db, 'adminRequests'), orderBy('createdAt', 'desc'));
      unsubAdminRequests = onSnapshot(qAdminRequests, (snapshot) => {
        setAdminRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminRequest)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'adminRequests'));
    } else {
      // User only sees their own requests
      const qAdminRequests = query(collection(db, 'adminRequests'), where('userId', '==', user.uid));
      unsubAdminRequests = onSnapshot(qAdminRequests, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminRequest));
        // Sort client-side to avoid needing a composite index
        reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAdminRequests(reqs);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'adminRequests'));
    }

    return () => {
      unsubEmployees();
      unsubTools();
      unsubMovements();
      unsubAdminRequests();
    };
  }, [isAuthReady, user, userRole]);

  const activeLoans = React.useMemo(() => {
    const loans = new Map<string, { quantity: number; lastCheckoutDate: string; assetId?: string }>();
    
    // Sort movements chronologically (oldest first) to replay them
    const sortedMovements = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedMovements.forEach(m => {
      const key = `${m.toolId}_${m.employeeId}_${m.assetId || ''}`;
      const current = loans.get(key) || { quantity: 0, lastCheckoutDate: '', assetId: m.assetId };
      if (m.type === 'checkout') {
        loans.set(key, { quantity: current.quantity + m.quantity, lastCheckoutDate: m.date, assetId: m.assetId });
      } else {
        loans.set(key, { quantity: Math.max(0, current.quantity - m.quantity), lastCheckoutDate: current.lastCheckoutDate, assetId: m.assetId });
      }
    });
    
    const result: ActiveLoan[] = [];
    loans.forEach((data, key) => {
      if (data.quantity > 0) {
        const [toolId, employeeId] = key.split('_');
        result.push({ toolId, employeeId, assetId: data.assetId, quantity: data.quantity, lastCheckoutDate: data.lastCheckoutDate });
      }
    });
    
    return result;
  }, [movements]);

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    try {
      const newDocRef = doc(collection(db, 'employees'));
      await setDoc(newDocRef, emp);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'employees');
    }
  };

  const updateEmployee = async (id: string, emp: Omit<Employee, 'id'>) => {
    try {
      await updateDoc(doc(db, 'employees', id), emp);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${id}`);
    }
  };

  const removeEmployee = async (id: string) => {
    try {
      const hasActiveLoans = activeLoans.some(loan => loan.employeeId === id);
      if (hasActiveLoans) {
        console.warn('Tentativa de excluir colaborador com empréstimos ativos bloqueada.');
        return;
      }
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  };

  const addTool = async (tool: Omit<Tool, 'id' | 'availableQuantity'>) => {
    try {
      const newDocRef = doc(collection(db, 'tools'));
      await setDoc(newDocRef, { ...tool, availableQuantity: tool.totalQuantity });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tools');
    }
  };

  const updateTool = async (id: string, tool: Omit<Tool, 'id' | 'availableQuantity'>) => {
    try {
      const existingTool = tools.find(t => t.id === id);
      if (!existingTool) return;
      const diff = tool.totalQuantity - existingTool.totalQuantity;
      const newAvailableQuantity = Math.max(0, existingTool.availableQuantity + diff);
      await updateDoc(doc(db, 'tools', id), { ...tool, availableQuantity: newAvailableQuantity });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tools/${id}`);
    }
  };

  const removeTool = async (id: string) => {
    try {
      const tool = tools.find(t => t.id === id);
      const hasActiveLoans = activeLoans.some(loan => loan.toolId === id);
      if ((tool && tool.availableQuantity < tool.totalQuantity) || hasActiveLoans) {
        console.warn('Tentativa de excluir ferramenta em uso bloqueada.');
        return;
      }
      await deleteDoc(doc(db, 'tools', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tools/${id}`);
    }
  };

  const recordMovement = async (movement: Omit<Movement, 'id' | 'date'>) => {
    if (userRole !== 'admin') {
      return { success: false, message: 'Acesso negado. Apenas administradores podem registrar movimentações.' };
    }

    const tool = tools.find(t => t.id === movement.toolId);
    const employee = employees.find(e => e.id === movement.employeeId);

    if (!tool || !employee) return { success: false, message: 'Ferramenta ou colaborador não encontrado.' };

    let previousQuantity = tool.availableQuantity;
    let newQuantity = tool.availableQuantity;

    if (movement.type === 'checkout') {
      const hasCompetency = tool.requiredCompetencies.every(req => employee.competencies.includes(req));
      if (!hasCompetency) {
        return { success: false, message: `Colaborador não possui as competências necessárias (${tool.requiredCompetencies.join(', ')}).` };
      }

      if (tool.availableQuantity < movement.quantity) {
        return { success: false, message: 'Quantidade indisponível no estoque.' };
      }

      newQuantity = tool.availableQuantity - movement.quantity;
    } else {
      if (tool.availableQuantity + movement.quantity > tool.totalQuantity) {
         return { success: false, message: 'Quantidade devolvida excede o total registrado.' };
      }
      newQuantity = tool.availableQuantity + movement.quantity;
    }

    const newMovement: any = {
      toolId: movement.toolId,
      employeeId: movement.employeeId,
      type: movement.type,
      quantity: movement.quantity,
      date: new Date().toISOString(),
      previousQuantity,
      newQuantity,
    };

    if (movement.assetId && movement.assetId.trim() !== '') {
      newMovement.assetId = movement.assetId.trim();
    }

    // Execute Firestore updates
    try {
      const movementRef = doc(collection(db, 'movements'));
      await setDoc(movementRef, newMovement);
      await updateDoc(doc(db, 'tools', tool.id), { availableQuantity: newQuantity });
      return { success: true, message: 'Movimentação registrada com sucesso.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'movements/tools');
      return { success: false, message: 'Erro ao registrar movimentação.' };
    }
  };

  const requestAdminAccess = async () => {
    if (!user) return { success: false, message: 'Usuário não autenticado.' };
    
    // Check if there's already a pending request
    const existingRequest = adminRequests.find(r => r.userId === user.uid && r.status === 'pending');
    if (existingRequest) {
      return { success: false, message: 'Você já possui uma solicitação pendente.' };
    }

    try {
      const newRequestRef = doc(collection(db, 'adminRequests'));
      await setDoc(newRequestRef, {
        userId: user.uid,
        email: user.email || 'unknown@example.com',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      return { success: true, message: 'Solicitação enviada com sucesso.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'adminRequests');
      return { success: false, message: 'Erro ao enviar solicitação.' };
    }
  };

  const approveAdminRequest = async (requestId: string, userId: string) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'adminRequests', requestId), { status: 'approved' });
      // Update user role
      await updateDoc(doc(db, 'users', userId), { role: 'admin' });
      return { success: true, message: 'Solicitação aprovada. O usuário agora é administrador.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'adminRequests/users');
      return { success: false, message: 'Erro ao aprovar solicitação.' };
    }
  };

  const rejectAdminRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'adminRequests', requestId), { status: 'rejected' });
      return { success: true, message: 'Solicitação rejeitada.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'adminRequests');
      return { success: false, message: 'Erro ao rejeitar solicitação.' };
    }
  };

  const resetDatabase = async () => {
    if (userRole !== 'admin') {
      return { success: false, message: 'Acesso negado. Apenas administradores podem resetar o banco de dados.' };
    }

    try {
      const movementPromises = movements.map(m => deleteDoc(doc(db, 'movements', m.id)));
      const toolPromises = tools.map(t => deleteDoc(doc(db, 'tools', t.id)));
      const employeePromises = employees.map(e => deleteDoc(doc(db, 'employees', e.id)));
      
      await Promise.all([...movementPromises, ...toolPromises, ...employeePromises]);
      
      return { success: true, message: 'Banco de dados resetado com sucesso.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'multiple');
      return { success: false, message: 'Erro ao resetar banco de dados.' };
    }
  };

  if (!isAuthReady) return null;

  if (!user) {
    return <Login />;
  }

  return (
    <AppContext.Provider value={{ 
      user, userRole, employees, tools, movements, adminRequests, activeLoans,
      addEmployee, updateEmployee, removeEmployee, 
      addTool, updateTool, removeTool, recordMovement,
      requestAdminAccess, approveAdminRequest, rejectAdminRequest, resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
