import ErrorPage from './ErrorPage'

export default function NotFoundPage() {
  return <ErrorPage code="404" title="Page not found" message="The page you are looking for does not exist or has moved." />
}
