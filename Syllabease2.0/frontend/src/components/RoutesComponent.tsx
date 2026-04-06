import { Routes, Route, Navigate } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";

// Auth
import Login from "../auth/Login"; 
import Register from "../auth/Register";
import ChooseRole from "../auth/ChooseRole";  
import Forgotpassword from "../auth/Passwords/Forgotpassword";
import PasswordresetLink from "../auth/Passwords/Passwordreset";

// Layouts
import HeaderLayout from "../layouts/HeaderLayout";
import MainLayout from "../layouts/MainLayout"; 
import SyllabusLayout from "../layouts/SyllabusLayout";
import TOSLayout from "../layouts/TOSLayout";
import AUSyllabusLayout from "../layouts/AUSyllabusLayout";

// Auditor pages
import AUSyllabiList from "../views/auditor/Syllabus/SyllabiList";
import AUSyllabusView from "../views/auditor/Syllabus/SyllabusView";
import AUTOSList from "../views/auditor/TOS/TOSList";
import AUTOSView from "../views/auditor/TOS/TOSView";

// Admin pages
import AdminUsersList from "../views/admin/UsersList";
import AdminCollegesList from "../views/admin/CollegesList";
import AdminDepartmentsList from "../views/admin/DepartmentsList";
import AdminDepartmentDetails from "../views/admin/DepartmentDetails";
import AdminCurriculaList from  "../views/admin/CurriculaList";
import AdminDeadlinesList from "../views/admin/DeadlinesList";
import AdminCoursesList from "../views/admin/CoursesList";
import AdminBayanihanList from "../views/admin/BayanihansList";
import AdminPOPage from "../views/admin/ProgramOutcome/POPage"; 
import AdminPOCreate from "../views/admin/ProgramOutcome/POCreate"; 
import AdminPEOPage from "../views/admin/PEO/PEOPage";
import AdminPEOCreate from "../views/admin/PEO/PEOCreate";
import AdminMemo from "../views/admin/AdminMemo";
import AdminSyllabiList from "../views/admin/Syllabus/SyllabiList";
import AdminSyllabusView from "../views/admin/Syllabus/SyllabusView"; 
import AdminCOPOCreate from "../views/admin/Syllabus/COPOCreate";
import AdminSCOPOEdit from "../views/admin/Syllabus/SCOPOEdit";
import AdminCOTCreate from "../views/admin/Syllabus/COTCreate";
import AdminCRQCreate from "../views/admin/Syllabus/CRQCreate";
import AdminCOTReorder from "@/views/admin/Syllabus/COTReorder";
import AdminSyllabusDateOverride from "../views/admin/Syllabus/SyllabusDateOverride";
import AdminTOSDateOverride from "@/views/admin/TOS/TOSDateOverride";
import AdminTOSList from "../views/admin/TOS/TOSList";
import AdminTOSView from "../views/admin/TOS/TOSView";
import AdminTOSEditRow from "../views/admin/TOS/TOSEditRow";
import AdminSyllabusTemplateList from "@/views/admin/Syllabus/SyllabusTemplateList";
import AdminSyllabusTemplateCreate from "@/views/admin/Syllabus/SyllabusTemplateCreate";
import AdminRFTemplateList from "../views/admin/Syllabus/RFTemplateList";
import AdminRFTemplateCreate from "../views/admin/Syllabus/RFTemplateCreate";
import AdminRFTemplatePair from "@/views/admin/Syllabus/RFTemplatePair";
import AdminRFTemplateView from "@/views/admin/Syllabus/RFTemplateView";
import AdminTOSTemplateList from "@/views/admin/TOS/TOSTemplateList"; 
import AdminTOSTemplateCreate from "@/views/admin/TOS/TOSTemplateCreate";
import SyllabusReview from "@/views/admin/Syllabus/SyllabusReview";
import SyllabusReviewFormView from "@/views/admin/Syllabus/SyllabusReviewFormView";

// Dean pages 
import DeanDepartmentsList from "../views/dean/DepartmentsList";  
import DeanDeadlineList from "../views/dean/DeadlinesList"; 

import DeanMemoList from "../views/dean/MemoList"; 
import DeanMemoContentShow from "./MemoContentShow";

import DeanSyllabiList from "../views/dean/Syllabus/SyllabiList";
import DeanSyllabusView from "../views/dean/Syllabus/SyllabusView";

// Chairperson pages 
import ChairCurriculaList from  "../views/chairperson/CurriculaList";
import ChairCourseList from  "../views/chairperson/CoursesList";
import ChairBayanihanList from  "../views/chairperson/BayanihansList"; 
import ChairPOPage from "../views/chairperson/ProgramOutcome/POPage"; 
import ChairPOCreate from "../views/chairperson/ProgramOutcome/POCreate"; 
import ChairPEOPage from "../views/chairperson/PEO/PEOPage"; 
import ChairPEOCreate from "../views/chairperson/PEO/PEOCreate";
import ChairProgramsList from "../views/chairperson/ProgramsList";
import ChairSyllabiList from "../views/chairperson/Syllabus/SyllabiList";
import ChairSyllabusView from "../views/chairperson/Syllabus/SyllabusView";
// import ChairSyllabusReviewForm from "../views/chairperson/Syllabus/SyllabusReviewForm"; Old Review Form View
// import ChairSyllabusReviewChecklist from "../views/chairperson/Syllabus/SyllabusReviewChecklist";
import ChairTOSList from "../views/chairperson/TOS/TOSList";
import ChairTOSView from "../views/chairperson/TOS/TOSView";

// Bayanihan Leader pages
import BLBayanihansList from "../views/bayanihan_leader/BayanihanList";
import BLSyllabiList from "../views/bayanihan_leader/Syllabus/SyllabiList";
import BLSyllabusView from "../views/bayanihan_leader/Syllabus/SyllabusView";
import BLSyllabusComment from "@/views/bayanihan_leader/Syllabus/SyllabusComment";
import BLCOPOCreate from "../views/bayanihan_leader/Syllabus/COPOCreate";
import BLSCOPOEdit from "../views/bayanihan_leader/Syllabus/SCOPOEdit"; 
import BLCOTCreate from "../views/bayanihan_leader/Syllabus/COTCreate";
import BLCOTReorder from "../views/bayanihan_leader/Syllabus/COTReorder";
import BLCRQCreate from "../views/bayanihan_leader/Syllabus/CRQCreate";
// import BLSyllabusReviewForm from "../views/bayanihan_leader/Syllabus/SyllabusReviewForm"; Old Review Form View
import SyllabusAudit from "../views/bayanihan_leader/Syllabus/SyllabusAudit";

import BLTOSList from "../views/bayanihan_leader/TOS/TOSList";
import BLTOSView from "../views/bayanihan_leader/TOS/TOSView";
import BLTosEditRow from "../views/bayanihan_leader/TOS/TOSEditRow";
import TOSAudit from "../views/bayanihan_leader/TOS/TOSAudit";

// Bayanihan Teacher pages
import BTSyllabiList from "../views/bayanihan_teacher/Syllabus/SyllabiList"; 
import BTSyllabusView from "../views/bayanihan_teacher/Syllabus/SyllabusView"; 
import BTTOSList from "../views/bayanihan_teacher/TOS/TOSList";
import BTTOSView from "../views/bayanihan_teacher/TOS/TOSView";

// Memo View Page
import MemoPage from "../../src/components/MemoPage"; 

import EditProfilePage from "./EditProfilePage"; 
import SyllabusReportsList from "@/views/dean/SyllabusReportsList";
import TOSReportsList from "@/views/dean/TOSReportsList";

function RoutesComponent() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />  
      <Route path="/register" element={<Register />} /> 
      <Route path="/choose-role" element={<ChooseRole />} />  
      <Route path="/password-reset" element={<PasswordresetLink />} />
      <Route path="/forgot-password" element={<Forgotpassword />} />
      
      <Route path="/" element={<PrivateRoute><HeaderLayout /></PrivateRoute>}>
        <Route path="choose-role" element={<ChooseRole />} />  
        <Route path="profile" element={<EditProfilePage />} />
      </Route>
      
      {/* Admin routes */} 
      <Route path="/admin" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersList />} /> 
        <Route path="syllabus" element={<AdminSyllabiList />} /> 
        <Route path="syllabus/syllabus-template" element={<AdminSyllabusTemplateList />} /> 
        <Route path="syllabus/review-form-template" element={<AdminRFTemplateList />} />
        <Route path="syllabus/:syllabusId/override-date" element={<AdminSyllabusDateOverride />} /> 
        <Route path="tos/:tosId/override-date" element={<AdminTOSDateOverride />} /> 
        <Route path="tos" element={<AdminTOSList />} />
        <Route path="tos/tos-template" element={<AdminTOSTemplateList />} /> 
        <Route path="bayanihan" element={<AdminBayanihanList />} />
        <Route path="deadline" element={<AdminDeadlinesList />} /> 
        <Route path="syllabus-reports" element={<SyllabusReportsList />} />
        <Route path="tos-reports" element={<TOSReportsList />} />
        <Route path="memo" element={<AdminMemo />} />
        <Route path="memos/:id" element={<DeanMemoContentShow />} />
        <Route path="course" element={<AdminCoursesList />} />
        <Route path="curriculum" element={<AdminCurriculaList />} />
        <Route path="college" element={<AdminCollegesList />} />
        <Route path="department" element={<AdminDepartmentsList />} /> 
        <Route path="department/:departmentId/programs" element={<AdminDepartmentDetails />} />
        <Route path="department/:departmentId/programs/:poId/program-outcomes" element={<AdminPOPage />} />
        <Route path="department/:departmentId/programs/:poId/program-outcomes/edit" element={<AdminPOCreate />} />
        <Route path="department/:departmentId/programs/:poId/peos" element={<AdminPEOPage />} />
        <Route path="department/:departmentId/programs/:poId/peos/edit" element={<AdminPEOCreate />} />   
      </Route>  
      <Route path="/admin" element={<PrivateRoute><HeaderLayout /></PrivateRoute>}>
        <Route path="syllabus/syllabus-template/create" element={<AdminSyllabusTemplateCreate />} /> 
        <Route path="syllabus/syllabus-template/:id/create" element={<AdminSyllabusTemplateCreate />} /> 
        <Route path="syllabus/review-form-template/create" element={<AdminRFTemplateCreate />} />
        <Route path="syllabus/review-form-template/map" element={<AdminRFTemplatePair />} />
        <Route path="syllabus/review-form-template/:rfId/view" element={<AdminRFTemplateView />} />  
        <Route path="tos/tos-template/create" element={<AdminTOSTemplateCreate />} /> 
        <Route path="tos/tos-template/:id/create" element={<AdminTOSTemplateCreate />} /> 
      </Route>  
      <Route path="/admin/syllabus/:syllabusId" element={<PrivateRoute><SyllabusLayout /></PrivateRoute>}>
        <Route path="view" element={<AdminSyllabusView />} /> 
        <Route path="view/course-outcomes" element={<AdminCOPOCreate />} /> 
        <Route path="view/syllco-pos" element={<AdminSCOPOEdit />} /> 
        <Route path="view/course-outlines/:term" element={<AdminCOTCreate />} />  
        <Route path="view/course-outlines-reorder/:term" element={<AdminCOTReorder />} />  
        <Route path="view/course-requirements" element={<AdminCRQCreate />} />   
        <Route path="view/review-syllabus" element={<SyllabusReview />} /> 
        <Route path="view/review-form" element={<SyllabusReviewFormView />} /> 
        <Route path="view/audit-logs" element={<SyllabusAudit />} />        
        <Route path="comment" element={<BLSyllabusComment />} />   
      </Route> 
      <Route path="/admin/tos/:tosId" element={<PrivateRoute><TOSLayout /></PrivateRoute>}>
        <Route path="view" element={<AdminTOSView />} />  
        <Route path="view/edit-tos-rows" element={<AdminTOSEditRow />} />  
        <Route path="view/audit-logs" element={<TOSAudit />} />    
        <Route path="comment" element={<h1>TOS Comment</h1>} />   
      </Route>

      {/* Auditor routes */} 
      <Route path="/auditor" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="syllabus" replace />} />
        <Route path="syllabus" element={<AUSyllabiList />} />
        <Route path="tos" element={<AUTOSList />} />
      </Route>
      <Route path="/auditor/syllabus/:syllabusId" element={<PrivateRoute><AUSyllabusLayout /></PrivateRoute>}>
        <Route path="view" element={<AUSyllabusView />} />    
        <Route path="view/review-form" element={<SyllabusReviewFormView />} />    
      </Route> 
      <Route path="/auditor/tos/:tosId" element={<PrivateRoute><TOSLayout /></PrivateRoute>}>
        <Route path="view" element={<AUTOSView />} />  
        <Route path="view/audit-logs" element={<TOSAudit />} />    
      </Route>
              
      {/* Dean routes */}
      <Route path="/dean" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="syllabus" replace />} />
        <Route path="syllabus" element={<DeanSyllabiList />} />
        <Route path="syllabus-reports" element={<SyllabusReportsList />} />
        <Route path="tos-reports" element={<TOSReportsList />} />
        <Route path="deadline" element={<DeanDeadlineList />} /> 
        <Route path="memo" element={<DeanMemoList />} />
        <Route path="memos/:id" element={<DeanMemoContentShow />} />
        <Route path="department" element={<DeanDepartmentsList />} /> 
      </Route> 
      <Route path="/dean/syllabus/:syllabusId" element={<PrivateRoute><SyllabusLayout /></PrivateRoute>}>
        <Route path="view" element={<DeanSyllabusView />} />     
        <Route path="view/review-form" element={<SyllabusReviewFormView />} /> 
        <Route path="view/audit-logs" element={<SyllabusAudit />} />    
      </Route> 
              
      {/* Chairperson routes */} 
      <Route path="/chairperson" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="syllabus" replace />} />  
        <Route path="syllabus" element={<ChairSyllabiList />} /> 
        <Route path="tos" element={<ChairTOSList />} />
        <Route path="syllabus-reports" element={<SyllabusReportsList />} />
        <Route path="tos-reports" element={<TOSReportsList />} />
        <Route path="bayanihan" element={<ChairBayanihanList />} />
        <Route path="memo" element={<MemoPage />} />
        <Route path="memos/:id" element={<DeanMemoContentShow />} />
        <Route path="programs" element={<ChairProgramsList />} />
        <Route path="programs/:poId/program-outcomes" element={<ChairPOPage />} />
        <Route path="programs/:poId/program-outcomes/edit" element={<ChairPOCreate />} />
        <Route path="programs/:poId/peos" element={<ChairPEOPage />} />
        <Route path="programs/:poId/peos/edit" element={<ChairPEOCreate />} /> 
        <Route path="course" element={<ChairCourseList />} />
        <Route path="curriculum" element={<ChairCurriculaList />} />
      </Route>   
      <Route path="/chairperson/syllabus/:syllabusId" element={<PrivateRoute><SyllabusLayout /></PrivateRoute>}>
        <Route path="view" element={<ChairSyllabusView />} />   
        <Route path="view/review-syllabus" element={<SyllabusReview />} /> 
        <Route path="view/review-form" element={<SyllabusReviewFormView />} />  
        <Route path="view/audit-logs" element={<SyllabusAudit />} />     
      </Route> 
      <Route path="/chairperson/tos/:tosId" element={<PrivateRoute><TOSLayout /></PrivateRoute>}>
        <Route path="view" element={<ChairTOSView />} />  
        <Route path="view/audit-logs" element={<TOSAudit />} />    
      </Route>
              
      {/* Bayanihan Leader routes */} 
      <Route path="/bayanihan_leader" element={<PrivateRoute><MainLayout /></PrivateRoute>}> 
        <Route index element={<Navigate to="team" replace />} />
        <Route path="team" element={<BLBayanihansList />} />
        <Route path="syllabus" element={<BLSyllabiList />} /> 
        <Route path="tos" element={<BLTOSList />} />  
        <Route path="memo" element={<MemoPage />} />
        <Route path="memos/:id" element={<DeanMemoContentShow />} />
      </Route>  
      <Route path="/bayanihan_leader/syllabus/:syllabusId" element={<PrivateRoute><SyllabusLayout /></PrivateRoute>}>
        <Route path="view" element={<BLSyllabusView />} /> 
        <Route path="view/course-outcomes" element={<BLCOPOCreate />} /> 
        <Route path="view/syllco-pos" element={<BLSCOPOEdit />} /> 
        <Route path="view/course-outlines/:term" element={<BLCOTCreate />} />  
        <Route path="view/course-outlines-reorder/:term" element={<BLCOTReorder />} />  
        <Route path="view/course-requirements" element={<BLCRQCreate />} />   
        <Route path="view/review-form" element={<SyllabusReviewFormView />} /> 
        <Route path="view/audit-logs" element={<SyllabusAudit />} />     
        <Route path="comment" element={<BLSyllabusComment />} />   
      </Route> 
      <Route path="/bayanihan_leader/tos/:tosId" element={<PrivateRoute><TOSLayout /></PrivateRoute>}>
        <Route path="view" element={<BLTOSView />} />  
        <Route path="view/edit-tos-rows" element={< BLTosEditRow/>} />  
        <Route path="view/audit-logs" element={<TOSAudit />} />    
        <Route path="comment" element={<h1>TOS Comment</h1>} />   
      </Route>
              
      {/* Bayanihan Teacher routes */} 
      <Route path="/bayanihan_teacher" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="team" replace />} />
        <Route path="team" element={<BLBayanihansList />} />
        <Route path="syllabus" element={<BTSyllabiList />} />
        <Route path="tos" element={<BTTOSList />} />
        <Route path="memo" element={<MemoPage />} />
        <Route path="memos/:id" element={<DeanMemoContentShow />} />
      </Route> 
      <Route path="/bayanihan_teacher/syllabus/:syllabusId" element={<PrivateRoute><SyllabusLayout /></PrivateRoute>}>
        <Route path="view" element={<BTSyllabusView />} />  
        <Route path="view/audit-logs" element={<SyllabusAudit />} />     
        <Route path="view/review-form" element={<SyllabusReviewFormView />} />     
        <Route path="comment" element={<BLSyllabusComment />} />   
      </Route> 
      <Route path="/bayanihan_teacher/tos/:tosId" element={<PrivateRoute><TOSLayout /></PrivateRoute>}>
        <Route path="view" element={<BTTOSView />} />   
        <Route path="view/audit-logs" element={<TOSAudit />} />    
        <Route path="comment" element={<h1>TOS Comment</h1>} />   
      </Route>

    </Routes>
  );
}

export default RoutesComponent;