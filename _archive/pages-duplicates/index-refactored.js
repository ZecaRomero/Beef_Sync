import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// Hooks customizados
import useContabilidade from '../../hooks/useContabilidade'
import useRecipients from '../../hooks/useRecipients'

// Utilitários
import { 
  downloadBoletimGado, 
  enviarPorEmail, 
  enviarPorWhatsApp, 
  downloadNotasFiscais, 
  sendAllReports 
} from '../../utils/reportUtils'

// Componentes UI
import { 
  DocumentTextIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  TableCellsIcon,
  CalendarIcon,
  UserGroupIcon,
  TruckIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon
} from '../../components/ui/Icons'
import Button from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import ModernLayout from '../../components/ui/ModernLayout'
import StatsCard from '../../components/ui/StatsCard'
import ModernCard, { ModernCardHeader, ModernCardBody } from '../../components/ui/ModernCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

// Componentes específicos da contabilidade
import ReportCard from '../../components/contabilidade/ReportCard'
import RecipientsList from '../../components/contabilidade/RecipientsList'

export default function ContabilidadeRefactored() {
  return null // Página em refatoração - usar /contabilidade
}
