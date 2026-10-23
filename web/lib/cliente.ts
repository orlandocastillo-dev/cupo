"use client";

import type { ApiCupo } from "./api";
import { apiAws } from "./api-aws";
import { apiEjemplo } from "./api-ejemplo";

/** Con NEXT_PUBLIC_API_URL usa AWS; sin ella, el modo de ejemplo. */
export const api: ApiCupo = process.env.NEXT_PUBLIC_API_URL ? apiAws : apiEjemplo;
