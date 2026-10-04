// Local app interfaces
export interface AvailablePrinter { ipAddress: string, model: string, brand: string }
export interface AppearanceInterface { primaryColor?: string, primaryContrast?: string, secondaryColor?: string, secondaryContrast?: string, logoLight?: string, logoDark?: string }

// API Configuration
export interface ApiConfig { keyName: string; url: string; jwt?: string; permissions?: RolePermissionInterface[]; }

export type ApiListType = "MembershipApi" | "AttendanceApi" | "MessagingApi" | "ContentApi" | "GivingApi" | "AccessManagementApi";

// Permission interfaces
export interface RolePermissionInterface { id?: string; roleId?: string; contentType?: string; contentId?: string; action?: string; api?: string; }

// User and Authentication interfaces
export interface LoginResponseInterface {
  user: LoginUserInterface;
  churches: LoginUserChurchInterface[];
  userChurches?: LoginUserChurchInterface[];
  errors?: string[];
}

interface LoginUserInterface {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  jwt?: string;
}

export interface LoginUserChurchInterface {
  id?: string;
  name?: string;
  church?: {
    id?: string;
    name?: string;
    subDomain?: string;
  };
  apis?: { keyName: string, jwt: string, permissions: RolePermissionInterface[] }[];
}

// Person and Membership interfaces
export interface PersonInterface {
  id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nickName?: string;
  prefix?: string;
  suffix?: string;
  displayName?: string;
  birthDate?: Date;
  gender?: string;
  maritalStatus?: string;
  anniversary?: Date;
  membershipStatus?: string;
  householdId?: string;
  householdRole?: string;
  contactInfo?: ContactInfoInterface;
  photo?: string;
  photoUpdated?: Date;
  name?: NameInterface;
  nametagNotes?: string;
  grade?: string;
  isGuest?: boolean; // kiosk-local: person just added via addGuest, defaults their check-in type to guest
}

interface NameInterface {
  first?: string;
  middle?: string;
  last?: string;
  nick?: string;
  display?: string;
  title?: string;
  suffix?: string;
}

interface ContactInfoInterface {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  homePhone?: string;
  mobilePhone?: string;
  workPhone?: string;
  email?: string;
  pager?: string;
  fax?: string;
  skype?: string;
  workEmail?: string;
}

// Campus and Services interfaces
interface ServiceInterface { id?: string; campusId?: string; name?: string; }

export interface ServiceTimeInterface {
  id?: string;
  name?: string;
  longName?: string;
  serviceId?: string;
  service?: ServiceInterface;
  groups?: GroupInterface[];
}

// Group interfaces
export interface GroupInterface {
  id?: string;
  name?: string;
  categoryName?: string;
  memberCount?: number;
  trackAttendance?: boolean;
  parentPickup?: boolean;
  printNametag?: boolean;
  printPickup?: boolean;
  about?: string;
  photoUrl?: string;
  tags?: string;
  meetingTime?: string;
  meetingLocation?: string;
  labelArray?: string[];
  slug?: string;
  // Check-in eligibility + capacity (carried on GET /groups; publish-gated in @churchapps/helpers).
  minAgeMonths?: number;
  maxAgeMonths?: number;
  minGrade?: string;
  maxGrade?: string;
  capacity?: number;
  guestCapacity?: number;
  checkinClosed?: boolean;
  volunteerRatio?: number;
  minVolunteers?: number;
}

export type CheckinType = "member" | "guest" | "volunteer";

export interface HouseholdPickupInterface {
  id?: string;
  personId?: string;
  name: string;
  photoUrl?: string;
  relationship?: string;
  status: "trusted" | "notAuthorized";
  notes?: string;
}

export interface GroupServiceTimeInterface {
  id?: string;
  groupId?: string;
  serviceTimeId?: string;
  serviceTime?: ServiceTimeInterface;
}

// Attendance interfaces
export interface VisitInterface {
  id?: string;
  personId?: string;
  serviceId?: string;
  groupId?: string;
  visitDate?: Date;
  visitSessions?: VisitSessionInterface[];
  person?: PersonInterface;
  checkinType?: CheckinType;
  checkedInById?: string;
}

export interface VisitSessionInterface {
  id?: string;
  visitId?: string;
  sessionId?: string;
  visit?: VisitInterface;
  session?: SessionInterface;
}

interface SessionInterface { id?: string; groupId: string; serviceTimeId: string; sessionDate?: Date; displayName: string; }

// Label template interfaces
export interface LabelTemplateInterface {
  id?: string;
  churchId?: string;
  name?: string;
  labelType?: "nametag" | "pickup";
  width?: number;
  height?: number;
  isDefault?: boolean;
  content?: string;
}

export interface LabelBlockInterface {
  id?: string;
  type: "text" | "field" | "barcode" | "qrcode" | "box";
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  text?: string;
  field?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  symbology?: "code39" | "code128" | "qr";
  value?: string;
  fill?: string;
  border?: boolean;
  condition?: { field?: string; operator?: "notEmpty" | "empty" | "equals" | "notEquals"; value?: string };
}
