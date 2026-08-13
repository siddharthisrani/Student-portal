"use client";

interface Props {

  search: string;

  status: string;

  setSearch:
    (value: string) => void;

  setStatus:
    (value: string) => void;

}

export default function SubmissionFilters({

  search,

  status,

  setSearch,

  setStatus,

}: Props) {

  return (

    <div className="flex gap-4">

      <input

        value={search}

        onChange={(e)=>

          setSearch(e.target.value)

        }

        placeholder="Search student..."

        className="flex-1 rounded-xl border p-3"

      />

      <select

        value={status}

        onChange={(e)=>

          setStatus(e.target.value)

        }

        className="rounded-xl border p-3"

      >

        <option value="all">

          All

        </option>

        <option value="submitted">

          Submitted

        </option>

        <option value="checking">

          Checking

        </option>

        <option value="published">

          Published

        </option>

      </select>

    </div>

  );

}