
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ChatModal from "../components/ChatModal";

interface ChatRouteProps {
    currentUid: string;
    currentName: string;
}

interface ChatLocationState {
    targetName?: string;
}

export default function ChatRoute({
    currentUid,
    currentName,
}: ChatRouteProps) {
    const { targetUid } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const state = location.state as ChatLocationState | null;

    if (!targetUid) return null;

    return (
        <ChatModal
            currentUid={currentUid}
            currentName={currentName}
            targetUid={targetUid}
            targetName={state?.targetName || "Student"}
            onClose={() => navigate(-1)}
        />
    );
}
