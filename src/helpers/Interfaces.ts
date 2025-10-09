// Local app interfaces
export interface AvailablePrinter { ipAddress: string, model: string }
export interface AppearanceInterface { primaryColor?: string, primaryContrast?: string, secondaryColor?: string, secondaryContrast?: string, logoLight?: string, logoDark?: string }

// API Configuration
export interface ApiConfig {
  keyName: string;
  url: string;
  jwt?: string;
  permissions?: RolePermissionInterface[];
}

export type ApiListType = "MembershipApi" | "AttendanceApi" | "MessagingApi" | "ContentApi" | "GivingApi" | "AccessManagementApi";

// Permission interfaces
export interface RolePermissionInterface {
  id?: string;
  roleId?: string;
  contentType?: string;
  contentId?: string;
  action?: string;
  api?: string;
}

export interface PermissionInterface {
  api: string;
  contentType: string;
  action: string;
}

// User and Authentication interfaces
export interface LoginResponseInterface {
  user: LoginUserInterface;
  churches: LoginUserChurchInterface[];
  userChurches?: LoginUserChurchInterface[];
  errors?: string[];
}

export interface LoginUserInterface {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  jwt?: string;
  photo?: string;
}

export interface LoginUserChurchInterface {
  id?: string;
  name?: string;
  church?: {
    id?: string;
    name?: string;
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
}

export interface NameInterface {
  first?: string;
  middle?: string;
  last?: string;
  nick?: string;
  display?: string;
  title?: string;
  suffix?: string;
}

export interface ContactInfoInterface {
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

export interface HouseholdInterface {
  id?: string;
  name?: string;
}

export interface HouseholdMemberInterface {
  id?: string;
  householdId?: string;
  household?: HouseholdInterface;
  personId?: string;
  person?: PersonInterface;
  role?: string;
}

// Campus and Services interfaces
export interface CampusInterface {
  id?: string;
  name?: string;
}

export interface ServiceInterface {
  id?: string;
  campusId?: string;
  name?: string;
}

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
  about?: string;
  photoUrl?: string;
  tags?: string;
  meetingTime?: string;
  meetingLocation?: string;
  labelArray?: string[];
  slug?: string;
}

export interface GroupMemberInterface {
  id?: string;
  personId: string;
  person?: PersonInterface;
  groupId: string;
  group?: GroupInterface;
  leader?: boolean;
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
}

export interface VisitSessionInterface {
  id?: string;
  visitId?: string;
  sessionId?: string;
  visit?: VisitInterface;
  session?: SessionInterface;
}

export interface SessionInterface {
  id?: string;
  groupId: string;
  serviceTimeId: string;
  sessionDate?: Date;
  displayName: string;
}

export interface AttendanceInterface {
  campus: CampusInterface;
  service: ServiceInterface;
  serviceTime: ServiceTimeInterface;
  groupId: string;
}

export interface AttendanceRecordInterface {
  serviceTime: ServiceTimeInterface;
  service: ServiceInterface;
  campus: CampusInterface;
  week: number;
  count: number;
  visitDate: Date;
  groupId: string;
}

// Settings interface
export interface SettingInterface {
  id?: string;
  keyName?: string;
  value?: string;
}

// Form interfaces
export interface FormInterface {
  id?: string;
  name?: string;
  contentType?: string;
  restricted?: boolean;
  accessStartTime?: Date;
  accessEndTime?: Date;
  archived: boolean;
  action?: string;
}

export interface FormSubmissionInterface {
  id?: string;
  formId?: string;
  contentType?: string;
  contentId?: string;
  form?: FormInterface;
  answers?: AnswerInterface[];
  questions?: QuestionInterface[];
}

export interface AnswerInterface {
  id?: string;
  value?: string;
  questionId?: string;
  formSubmissionId?: string;
  required?: boolean;
}

export interface QuestionInterface {
  id?: string;
  formId?: string;
  title?: string;
  fieldType?: string;
  placeholder?: string;
  description?: string;
  choices?: string;
  required?: boolean;
  sort?: number;
}

// Search interface
export interface SearchCondition {
  field: string;
  operator: string;
  value: string;
}
