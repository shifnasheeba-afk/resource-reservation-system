
"use client";

import { useCallback, useEffect, useState } from "react";

type Resource = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
};

type Reservation = {
  id: number;
  title: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  resourceId: number;
  resource: Resource;
};

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100 outline-none focus:border-cyan-400";

const panelClass =
  "rounded-2xl border border-slate-800 bg-slate-900 p-6";

function localDateTime(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "Meeting Room",
    description: "",
    location: "",
    capacity: "",
  });

  const [bookingForm, setBookingForm] = useState({
    title: "",
    userName: "",
    userEmail: "",
    resourceId: "",
    startTime: "",
    endTime: "",
  });

  const [availabilityStart, setAvailabilityStart] = useState("");
  const [availabilityEnd, setAvailabilityEnd] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [resourceResponse, reservationResponse] = await Promise.all([
        fetch("/api/resources"),
        fetch("/api/reservations"),
      ]);

      if (!resourceResponse.ok || !reservationResponse.ok) {
        throw new Error("Could not load data. Check your database setup.");
      }

      const resourceData = await resourceResponse.json();
      const reservationData = await reservationResponse.json();

      setResources(resourceData);
      setReservations(reservationData);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function navigate(value: string) {
    setTab(value);
    setMessage("");
  }

  async function addResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not add resource.");
      }

      setResourceForm({
        name: "",
        type: "Meeting Room",
        description: "",
        location: "",
        capacity: "",
      });

      setMessage("Resource added successfully.");
      await loadData();
      setTab("resources");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  async function addReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (
      new Date(bookingForm.endTime).getTime() <=
      new Date(bookingForm.startTime).getTime()
    ) {
      setMessage("End time must be later than start time.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not make reservation.");
      }

      setBookingForm({
        title: "",
        userName: "",
        userEmail: "",
        resourceId: "",
        startTime: "",
        endTime: "",
      });

      setMessage("Reservation created successfully.");
      await loadData();
      setTab("reservations");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function getResourceReservations(resourceId: number) {
    return reservations
      .filter(
        (item) =>
          item.resourceId === resourceId && item.status !== "CANCELLED"
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime()
      );
  }

  function isReserved(resourceId: number) {
    if (!availabilityStart || !availabilityEnd) return false;

    const start = new Date(availabilityStart).getTime();
    const end = new Date(availabilityEnd).getTime();

    return getResourceReservations(resourceId).some(
      (item) =>
        new Date(item.startTime).getTime() < end &&
        new Date(item.endTime).getTime() > start
    );
  }

  const validAvailabilityRange =
    Boolean(availabilityStart) &&
    Boolean(availabilityEnd) &&
    new Date(availabilityEnd).getTime() >
      new Date(availabilityStart).getTime();

  const activeReservations = reservations.filter(
    (item) => item.status !== "CANCELLED"
  );

  const upcomingReservations = activeReservations.filter(
    (item) => new Date(item.endTime).getTime() >= Date.now()
  );

  const pageTitles: Record<string, string> = {
    dashboard: "Dashboard",
    resources: "All Resources",
    reservations: "All Reservations",
    availability: "Resource Availability",
    "new-resource": "Add a Resource",
    "new-reservation": "Book a Resource",
  };

  const navigation = [
    ["dashboard", "Dashboard"],
    ["resources", "Resources"],
    ["reservations", "Reservations"],
    ["availability", "Availability"],
    ["new-resource", "Add Resource"],
    ["new-reservation", "Book Resource"],
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <div className="mb-10">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
              R
            </div>
            <h1 className="text-xl font-bold">ReserveFlow</h1>
            <p className="mt-1 text-xs text-slate-400">
              Resource management
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map(([value, label]) => (
              <button
                key={value}
                onClick={() => navigate(value)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                  tab === value
                    ? "bg-cyan-400 font-semibold text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-12 rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
            <p className="text-sm font-semibold">Booking made simple</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Manage shared resources and keep reservations organized.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-5 md:px-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                RESOURCE RESERVATION SYSTEM
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {pageTitles[tab] || "Dashboard"}
              </h2>
            </div>

            <button
              onClick={() => void loadData()}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Refresh Data
            </button>
          </header>

          <div className="border-b border-slate-800 px-4 py-3 md:hidden">
            <select
              value={tab}
              onChange={(event) => navigate(event.target.value)}
              className={inputClass}
            >
              {navigation.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mx-auto max-w-7xl p-5 md:p-10">
            {message && (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-cyan-900 bg-cyan-950/50 p-4 text-sm text-cyan-200">
                <span>{message}</span>
                <button
                  onClick={() => setMessage("")}
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            )}

            {loading ? (
              <div className={panelClass + " text-center text-slate-400"}>
                Loading your data...
              </div>
            ) : (
              <>
                {tab === "dashboard" && (
                  <>
                    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "Total Resources",
                          value: resources.length,
                          note: "Resources in the system",
                        },
                        {
                          label: "Total Reservations",
                          value: reservations.length,
                          note: "All booking records",
                        },
                        {
                          label: "Upcoming Bookings",
                          value: upcomingReservations.length,
                          note: "Not yet ended",
                        },
                        {
                          label: "Resource Types",
                          value: new Set(resources.map((item) => item.type))
                            .size,
                          note: "Different categories",
                        },
                      ].map((stat) => (
                        <div key={stat.label} className={panelClass}>
                          <p className="text-sm text-slate-400">
                            {stat.label}
                          </p>
                          <p className="my-4 text-4xl font-bold">
                            {stat.value}
                          </p>
                          <p className="text-xs text-slate-500">
                            {stat.note}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                      <div className={panelClass}>
                        <div className="mb-6 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Recent Reservations
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              Latest booking activity
                            </p>
                          </div>
                          <button
                            onClick={() => navigate("reservations")}
                            className="text-sm text-cyan-400"
                          >
                            View all
                          </button>
                        </div>

                        {reservations.length === 0 ? (
                          <p className="rounded-xl bg-slate-800/60 p-6 text-sm text-slate-400">
                            No reservations yet. Book a resource to get
                            started.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {reservations.slice(0, 5).map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/60 p-4"
                              >
                                <div>
                                  <p className="font-medium">{item.title}</p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {item.resource?.name || "Resource"} ·{" "}
                                    {item.userName}
                                  </p>
                                </div>
                                <span className="text-xs text-cyan-300">
                                  {formatDate(item.startTime)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={panelClass}>
                        <h3 className="text-lg font-semibold">
                          Quick Actions
                        </h3>
                        <p className="mb-6 mt-1 text-sm text-slate-400">
                          Manage your resources and bookings
                        </p>

                        <div className="space-y-3">
                          {[
                            ["new-resource", "+ Add a resource"],
                            ["new-reservation", "+ Create reservation"],
                            ["availability", "View availability"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => navigate(value)}
                              className="w-full rounded-xl border border-slate-700 p-4 text-left font-semibold transition hover:bg-slate-800"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tab === "resources" && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {resources.map((resource) => (
                      <div key={resource.id} className={panelClass}>
                        <div className="mb-5 flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">
                            {resource.type.toLowerCase().includes("room")
                              ? "▦"
                              : "◇"}
                          </div>
                          <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs text-emerald-300">
                            Active
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold">
                          {resource.name}
                        </h3>
                        <p className="mt-1 text-sm text-cyan-300">
                          {resource.type}
                        </p>
                        <p className="mt-4 min-h-10 text-sm text-slate-400">
                          {resource.description || "No description provided."}
                        </p>

                        <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-400">
                          <p>Location: {resource.location || "Not specified"}</p>
                          <p>
                            Capacity: {resource.capacity ?? "Not specified"}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setBookingForm((previous) => ({
                              ...previous,
                              resourceId: String(resource.id),
                            }));
                            navigate("new-reservation");
                          }}
                          className="mt-5 w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                        >
                          Book this resource
                        </button>
                      </div>
                    ))}

                    {resources.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                        <p className="font-semibold">
                          No resources added yet
                        </p>
                        <button
                          onClick={() => navigate("new-resource")}
                          className="mt-4 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
                        >
                          Add your first resource
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {tab === "new-resource" && (
                  <form
                    onSubmit={addResource}
                    className="max-w-2xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">
                        Resource Information
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Add a meeting room, device, or shared facility.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Resource name *
                      </label>
                      <input
                        required
                        value={resourceForm.name}
                        onChange={(event) =>
                          setResourceForm({
                            ...resourceForm,
                            name: event.target.value,
                          })
                        }
                        placeholder="e.g. Conference Room A"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Resource type *
                      </label>
                      <select
                        value={resourceForm.type}
                        onChange={(event) =>
                          setResourceForm({
                            ...resourceForm,
                            type: event.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option>Meeting Room</option>
                        <option>Equipment</option>
                        <option>Projector</option>
                        <option>Laptop</option>
                        <option>Training Room</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Location
                      </label>
                      <input
                        value={resourceForm.location}
                        onChange={(event) =>
                          setResourceForm({
                            ...resourceForm,
                            location: event.target.value,
                          })
                        }
                        placeholder="e.g. Floor 2"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={resourceForm.capacity}
                        onChange={(event) =>
                          setResourceForm({
                            ...resourceForm,
                            capacity: event.target.value,
                          })
                        }
                        placeholder="e.g. 12"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        value={resourceForm.description}
                        onChange={(event) =>
                          setResourceForm({
                            ...resourceForm,
                            description: event.target.value,
                          })
                        }
                        placeholder="Describe the resource and its facilities"
                        className={inputClass}
                      />
                    </div>

                    <button
                      disabled={busy}
                      className="w-full rounded-xl bg-cyan-400 p-4 font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {busy ? "Saving..." : "Save Resource"}
                    </button>
                  </form>
                )}

                {tab === "new-reservation" && (
                  <form
                    onSubmit={addReservation}
                    className="max-w-2xl space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">
                        Reservation Details
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Choose a resource and your booking time.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Booking title *
                      </label>
                      <input
                        required
                        value={bookingForm.title}
                        onChange={(event) =>
                          setBookingForm({
                            ...bookingForm,
                            title: event.target.value,
                          })
                        }
                        placeholder="e.g. Project planning meeting"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Your name *
                      </label>
                      <input
                        required
                        value={bookingForm.userName}
                        onChange={(event) =>
                          setBookingForm({
                            ...bookingForm,
                            userName: event.target.value,
                          })
                        }
                        placeholder="Full name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Email address *
                      </label>
                      <input
                        required
                        type="email"
                        value={bookingForm.userEmail}
                        onChange={(event) =>
                          setBookingForm({
                            ...bookingForm,
                            userEmail: event.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Select resource *
                      </label>
                      <select
                        required
                        value={bookingForm.resourceId}
                        onChange={(event) =>
                          setBookingForm({
                            ...bookingForm,
                            resourceId: event.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="">Choose a resource</option>
                        {resources.map((resource) => (
                          <option key={resource.id} value={resource.id}>
                            {resource.name} — {resource.type}
                          </option>
                        ))}
                      </select>
                      {resources.length === 0 && (
                        <p className="mt-2 text-sm text-amber-300">
                          Add a resource before making a reservation.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-slate-300">
                          Start date and time *
                        </label>
                        <input
                          required
                          type="datetime-local"
                          value={bookingForm.startTime}
                          onChange={(event) =>
                            setBookingForm({
                              ...bookingForm,
                              startTime: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-slate-300">
                          End date and time *
                        </label>
                        <input
                          required
                          type="datetime-local"
                          min={bookingForm.startTime || undefined}
                          value={bookingForm.endTime}
                          onChange={(event) =>
                            setBookingForm({
                              ...bookingForm,
                              endTime: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <button
                      disabled={busy || resources.length === 0}
                      className="w-full rounded-xl bg-cyan-400 p-4 font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {busy ? "Creating reservation..." : "Confirm Reservation"}
                    </button>
                  </form>
                )}

                {tab === "reservations" && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-slate-800 bg-slate-800/60 text-slate-400">
                        <tr>
                          <th className="p-4 font-medium">Booking</th>
                          <th className="p-4 font-medium">Resource</th>
                          <th className="p-4 font-medium">Reserved by</th>
                          <th className="p-4 font-medium">Start</th>
                          <th className="p-4 font-medium">End</th>
                          <th className="p-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {reservations.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40">
                            <td className="p-4 font-medium">{item.title}</td>
                            <td className="p-4">
                              {item.resource?.name || "Resource"}
                              <p className="mt-1 text-xs text-slate-400">
                                {item.resource?.type || ""}
                              </p>
                            </td>
                            <td className="p-4">
                              {item.userName}
                              <p className="mt-1 text-xs text-slate-400">
                                {item.userEmail}
                              </p>
                            </td>
                            <td className="p-4 text-slate-300">
                              {formatDate(item.startTime)}
                            </td>
                            <td className="p-4 text-slate-300">
                              {formatDate(item.endTime)}
                            </td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs ${
                                  item.status === "CANCELLED"
                                    ? "bg-red-950 text-red-300"
                                    : "bg-emerald-950 text-emerald-300"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reservations.length === 0 && (
                      <p className="p-10 text-center text-slate-400">
                        No reservations to display yet.
                      </p>
                    )}
                  </div>
                )}

                {tab === "availability" && (
                  <div className="space-y-6">
                    <div className={panelClass}>
                      <h3 className="text-lg font-semibold">
                        Check Resource Availability
                      </h3>
                      <p className="mb-5 mt-2 text-sm text-slate-400">
                        Select a start and end time to check which resources
                        are free during that period.
                      </p>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm text-slate-300">
                            Start date and time
                          </label>
                          <input
                            type="datetime-local"
                            value={availabilityStart}
                            onChange={(event) =>
                              setAvailabilityStart(event.target.value)
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-slate-300">
                            End date and time
                          </label>
                          <input
                            type="datetime-local"
                            min={availabilityStart || undefined}
                            value={availabilityEnd}
                            onChange={(event) =>
                              setAvailabilityEnd(event.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {availabilityStart &&
                        availabilityEnd &&
                        !validAvailabilityRange && (
                          <p className="mt-3 text-sm text-amber-300">
                            End time must be later than start time.
                          </p>
                        )}

                      {validAvailabilityRange && (
                        <div className="mt-5 flex flex-wrap gap-3 text-sm">
                          <span className="rounded-full bg-emerald-950 px-3 py-2 text-emerald-300">
                            Available:{" "}
                            {
                              resources.filter(
                                (item) => !isReserved(item.id)
                              ).length
                            }
                          </span>
                          <span className="rounded-full bg-red-950 px-3 py-2 text-red-300">
                            Reserved:{" "}
                            {
                              resources.filter((item) => isReserved(item.id))
                                .length
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {resources.map((resource) => {
                        const resourceReservations =
                          getResourceReservations(resource.id);

                        const reserved = validAvailabilityRange
                          ? isReserved(resource.id)
                          : false;

                        return (
                          <div key={resource.id} className={panelClass}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {resource.name}
                                </h3>
                                <p className="mt-1 text-sm text-cyan-300">
                                  {resource.type}
                                </p>
                              </div>

                              {validAvailabilityRange ? (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    reserved
                                      ? "bg-red-950 text-red-300"
                                      : "bg-emerald-950 text-emerald-300"
                                  }`}
                                >
                                  {reserved ? "Reserved" : "Available"}
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                  Select time
                                </span>
                              )}
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-400">
                              <p>
                                Location: {resource.location || "Not specified"}
                              </p>
                              <p>
                                Capacity: {resource.capacity ?? "Not specified"}
                              </p>
                            </div>

                            <div className="mt-5 border-t border-slate-800 pt-4">
                              <p className="mb-3 text-sm font-semibold text-slate-200">
                                Existing bookings
                              </p>

                              {resourceReservations.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                  No active bookings.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {resourceReservations.slice(0, 3).map(
                                    (item) => {
                                      const overlaps =
                                        validAvailabilityRange &&
                                        new Date(item.startTime).getTime() <
                                          new Date(
                                            availabilityEnd
                                          ).getTime() &&
                                        new Date(item.endTime).getTime() >
                                          new Date(
                                            availabilityStart
                                          ).getTime();

                                      return (
                                        <div
                                          key={item.id}
                                          className="rounded-xl bg-slate-800/60 p-3"
                                        >
                                          <p className="font-medium text-slate-200">
                                            {item.title}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-400">
                                            {formatDate(item.startTime)}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-400">
                                            Until {formatDate(item.endTime)}
                                          </p>
                                          {overlaps && (
                                            <p className="mt-2 text-xs font-semibold text-red-300">
                                              Conflicts with selected time
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setBookingForm((previous) => ({
                                  ...previous,
                                  resourceId: String(resource.id),
                                  startTime:
                                    availabilityStart || previous.startTime,
                                  endTime:
                                    availabilityEnd || previous.endTime,
                                }));
                                navigate("new-reservation");
                              }}
                              className="mt-5 w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                            >
                              Book this resource
                            </button>
                          </div>
                        );
                      })}

                      {resources.length === 0 && (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                          <p className="font-semibold">
                            No resources added yet
                          </p>
                          <p className="mt-2 text-sm text-slate-400">
                            Add a room or equipment before checking
                            availability.
                          </p>
                          <button
                            onClick={() => navigate("new-resource")}
                            className="mt-4 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
                          >
                            Add Resource
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
              ReserveFlow · Resource Reservation Management System
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
