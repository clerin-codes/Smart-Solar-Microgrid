import { useState } from 'react'
import { validate } from '../utils/validators'

// Small form helper: values, per-field errors (shown once touched), and submit guarding.
export function useForm(initialValues, rules = {}) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})

  const allErrors = validate(values, rules)
  const errors = Object.fromEntries(Object.entries(allErrors).filter(([k]) => touched[k]))

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
  }
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const touchAll = () => setTouched(Object.fromEntries(Object.keys(rules).map((k) => [k, true])))

  const handleSubmit = (onValid) => (e) => {
    e.preventDefault()
    touchAll()
    if (Object.keys(allErrors).length === 0) onValid(values)
  }

  return {
    values,
    setValues,
    errors,
    isValid: Object.keys(allErrors).length === 0,
    handleChange,
    handleBlur,
    handleSubmit,
  }
}
