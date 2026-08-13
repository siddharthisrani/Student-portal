"use client";

import { useEffect, useState } from "react";

import SubmissionFilters from "./SubmissionFilters";
import SubmissionTable from "./SubmissionTable";

export default function SubmissionList() {

  const [loading, setLoading] =
    useState(true);

  const [submissions, setSubmissions] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  useEffect(() => {

    load();

  }, []);

  async function load() {

    try {

      const response =
        await fetch(
          "/api/admin/submissions"
        );

      const data =
        await response.json();

      if (data.success) {

        setSubmissions(
          data.submissions
        );

      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (

      <div className="p-10">

        Loading...

      </div>

    );

  }

  const filtered =
    submissions.filter((s) => {

      const matchSearch =

        s.student.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        s.test.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchStatus =

        status === "all"

          ? true

          : s.status === status;

      return (
        matchSearch &&
        matchStatus
      );

    });

  return (

    <div className="space-y-6">

      <SubmissionFilters

        search={search}

        setSearch={setSearch}

        status={status}

        setStatus={setStatus}

      />

      <SubmissionTable

        submissions={filtered}

      />

    </div>

  );

}