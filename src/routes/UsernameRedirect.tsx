
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function UsernameRedirect() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveUsername() {
      if (!username) {
        setNotFound(true);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, "users"));

        const match = snapshot.docs.find(
          (document) => slugify(document.data().name || "") === username
        );

        if (cancelled) return;

        if (match) {
          navigate(`/showcase/${match.id}`, { replace: true });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Username resolution failed:", err);
        if (!cancelled) setError(true);
      }
    }

    resolveUsername();

    return () => {
      cancelled = true;
    };
  }, [username, navigate]);

  if (error) return <p>Unable to load this profile. Please try again.</p>;

  if (notFound) {
    return (
      <div className="p-10 text-center">
        <h1>404</h1>
        <p>User not found</p>
      </div>
    );
  }

  return <p>Finding user...</p>;
}
