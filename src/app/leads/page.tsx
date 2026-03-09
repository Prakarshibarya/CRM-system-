"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  title: string;
  contactName?: string;
  contactEmail?: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const organizerId = "test";

  async function fetchLeads() {
    const res = await fetch(`/api/leads?organizerId=${organizerId}`);
    const data = await res.json();
    setLeads(data.leads || []);
  }

  async function createLead() {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizerId,
        title,
        contactName: name,
        contactEmail: email,
      }),
    });

    if (res.ok) {
      setTitle("");
      setName("");
      setEmail("");
      fetchLeads();
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Leads</h1>

      <h2>Create Lead</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="Contact Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Contact Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button onClick={createLead}>Create</button>
      </div>

      <h2>Lead List</h2>

      <ul>
        {leads.map((lead) => (
          <li key={lead.id}>
            <b>{lead.title}</b> — {lead.contactName}
          </li>
        ))}
      </ul>
    </div>
  );
}