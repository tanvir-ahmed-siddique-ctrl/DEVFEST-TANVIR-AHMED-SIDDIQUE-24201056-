export interface Tender {
  tender_id: string
  title: string
  procuring_entity: string
  bidder: string
  submission_deadline: string
}

export interface Requirement {
  id: string
  order: number
  title_en: string
  title_bn: string
  mandatory: boolean
  has_expiry: boolean
}

export interface RequirementsData {
  tender: Tender
  requirements: Requirement[]
}

export type RequirementStatus =
  | 'Missing'
  | 'Expiry date needed'
  | 'Expired'
  | 'Not provided'
  | 'OK'

export interface UploadedPdf {
  id: string
  file: File
  name: string
  size: number
  pageCount: number
  hash: string
  thumbnail?: string
}

export type Matches = Record<string, string>
export type ExpiryDates = Record<string, string>

export interface ValidationIssue {
  code: string
  path: string
}

