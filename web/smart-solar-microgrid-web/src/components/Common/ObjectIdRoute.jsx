import { Outlet, useParams } from 'react-router-dom'
import ErrorPage from '../../pages/ErrorPage'

// Shows the 404 page inside the layout when :id is not a valid MongoDB id, instead of calling the API with junk.
export default function ObjectIdRoute() {
  const { id } = useParams()
  if (!/^[0-9a-f]{24}$/i.test(id ?? '')) {
    return <ErrorPage embedded code="404" title="Page not found" message="The page you are looking for does not exist or has moved." />
  }
  return <Outlet />
}
