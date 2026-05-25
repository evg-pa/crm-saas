import { redirect } from "next/navigation";

/**
 * Root page — redirects to login for now.
 * In the future this will detect an existing session and redirect to the dashboard.
 */
export default function Home() {
  redirect("/contacts");
}
