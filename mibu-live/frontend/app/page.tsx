"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error("Error connecting to backend:", err));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <h1 className="text-6xl font-bold mb-8">Mibu Live</h1>
      <p className="text-2xl mb-4">Frontend: Next.js</p>
      <p className="text-2xl">
        Backend: {message || "Connecting..."}
      </p>
    </div>
  );
}
