import { Navigate } from "react-router-dom";
import { candidateCvListUrl } from "../../../../../routes/urls";

export default function MyCV() {
  return <Navigate to={candidateCvListUrl} replace />;
}