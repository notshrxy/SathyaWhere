/**
 * TypeScript Types for Database Tables
 * 
 * These types match exactly with your Supabase database schema.
 * Use these types throughout your application for type safety.
 */

// ============================================
// STUDENTS TABLE
// ============================================

export type StudentRank = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Student {
  id: string; // UUID
  registration_number: string;
  email: string;
  password_hash: string;
  first_login: boolean;
  is_admin: boolean;
  
  // Profile
  full_name: string | null;
  department: string | null;
  year: number | null;
  
  // ID Card
  id_card_image_path: string | null;
  id_card_verified: boolean;
  
  // Karma System
  returns_count: number;
  rank: StudentRank;
  
  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string;
}

export interface StudentInsert {
  registration_number: string;
  email: string;
  password_hash: string;
  first_login?: boolean;
  is_admin?: boolean;
  full_name?: string | null;
  department?: string | null;
  year?: number | null;
  id_card_image_path?: string | null;
  id_card_verified?: boolean;
  returns_count?: number;
  rank?: StudentRank;
}

export interface StudentUpdate {
  full_name?: string | null;
  department?: string | null;
  year?: number | null;
  id_card_image_path?: string | null;
  id_card_verified?: boolean;
  password_hash?: string;
  first_login?: boolean;
  returns_count?: number;
  rank?: StudentRank;
}

// ============================================
// OTP CODES TABLE
// ============================================

export interface OtpCode {
  id: string;
  registration_number: string;
  email: string;
  otp_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface OtpCodeInsert {
  registration_number: string;
  email: string;
  otp_hash: string;
  expires_at: string;
  used?: boolean;
}

// ============================================
// ITEMS TABLE
// ============================================

export type ItemType = 'lost' | 'found';
export type ItemStatus = 
  | 'pending_approval' 
  | 'published' 
  | 'claimed' 
  | 'returned' 
  | 'rejected';

export interface HiddenMetadata {
  scratches?: string;
  stickers?: string[];
  keychains?: string;
  zipper_tags?: string;
  serial_number?: string;
  other_marks?: string;
  texture?: string;
  wear_marks?: string;
  // Add more fields as needed
}

export interface AIScanResults {
  item_type?: string; // e.g., "headphones", "wallet", "laptop"
  color?: string;
  brand?: string;
  model?: string;
  serial_numbers?: string[];
  distinguishable_marks?: string[];
  confidence?: number; // 0-100
}

export interface Item {
  id: string;
  item_type: ItemType;
  
  // Public Info
  item_name: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  location_last_seen: string | null;
  date_lost_or_found: string | null; // ISO timestamp
  
  // Images
  item_image_path: string | null;
  bill_invoice_path: string | null;
  
  // AI Results
  ai_scan_results: AIScanResults | null;
  ai_scan_successful: boolean;
  
  // Hidden Metadata (ADMIN ONLY)
  hidden_metadata: HiddenMetadata;
  
  // Status
  status: ItemStatus;
  
  // User Info
  reported_by: string; // Student UUID
  finder_contact_hidden: boolean;
  
  // Bluetooth
  is_bluetooth_device: boolean;
  bluetooth_verified: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null; // Admin UUID
}

export interface ItemInsert {
  item_type: ItemType;
  item_name: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  location_last_seen?: string | null;
  date_lost_or_found?: string | null;
  item_image_path?: string | null;
  bill_invoice_path?: string | null;
  ai_scan_results?: AIScanResults | null;
  ai_scan_successful?: boolean;
  hidden_metadata: HiddenMetadata;
  status?: ItemStatus;
  reported_by: string;
  finder_contact_hidden?: boolean;
  is_bluetooth_device?: boolean;
  bluetooth_verified?: boolean;
}

export interface ItemUpdate {
  item_name?: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  location_last_seen?: string | null;
  date_lost_or_found?: string | null;
  item_image_path?: string | null;
  bill_invoice_path?: string | null;
  ai_scan_results?: AIScanResults | null;
  ai_scan_successful?: boolean;
  hidden_metadata?: HiddenMetadata;
  status?: ItemStatus;
  approved_at?: string | null;
  approved_by?: string | null;
  bluetooth_verified?: boolean;
}

// ============================================
// CLAIMS TABLE
// ============================================

export type ClaimStatus = 
  | 'pending' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'returned';

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  
  description: string | null;
  hidden_details_claimed: HiddenMetadata;
  serial_number_provided: string | null;
  last_seen_location: string | null;
  
  // Matching Results
  similarity_score: number; // 0.00 to 100.00
  match_threshold_met: boolean; // true if >= 75.00
  
  // Status
  status: ClaimStatus;
  
  // Admin Review
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  
  // Bluetooth
  bluetooth_verified: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ClaimInsert {
  item_id: string;
  claimant_id: string;
  description?: string | null;
  hidden_details_claimed: HiddenMetadata;
  serial_number_provided?: string | null;
  last_seen_location?: string | null;
  similarity_score?: number;
  match_threshold_met?: boolean;
  status?: ClaimStatus;
  bluetooth_verified?: boolean;
}

export interface ClaimUpdate {
  description?: string | null;
  hidden_details_claimed?: HiddenMetadata;
  serial_number_provided?: string | null;
  last_seen_location?: string | null;
  similarity_score?: number;
  match_threshold_met?: boolean;
  status?: ClaimStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  admin_notes?: string | null;
  bluetooth_verified?: boolean;
}

// ============================================
// QR TOKENS TABLE
// ============================================

export interface QrToken {
  id: string;
  claim_id: string;
  item_id: string;
  token: string; // Unique token string
  qr_code_image_path: string | null;
  redeemed: boolean;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface QrTokenInsert {
  claim_id: string;
  item_id: string;
  token: string;
  qr_code_image_path?: string | null;
  redeemed?: boolean;
  expires_at: string;
}

export interface QrTokenUpdate {
  redeemed?: boolean;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
}

// ============================================
// CROWD ALERTS TABLE
// ============================================

export interface CrowdAlert {
  id: string;
  zone_name: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  start_time: string; // TIME format "HH:MM:SS"
  end_time: string;
  active_days: number[]; // [1,2,3,4,5] = Mon-Fri
  alert_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrowdAlertInsert {
  zone_name: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number;
  start_time: string;
  end_time: string;
  active_days?: number[];
  alert_message: string;
  is_active?: boolean;
}

// ============================================
// NOTIFICATIONS TABLE
// ============================================

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'alert' 
  | 'claim_update';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  read_at: string | null;
  related_item_id: string | null;
  related_claim_id: string | null;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  read?: boolean;
  related_item_id?: string | null;
  related_claim_id?: string | null;
}

