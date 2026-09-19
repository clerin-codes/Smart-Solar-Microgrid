export const required = (v) => (String(v ?? '').trim() ? '' : 'This field is required.')
export const email = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '') ? '' : 'Enter a valid email address.'
export const phone = (v) => (/^\+?[0-9]{9,12}$/.test(v ?? '') ? '' : 'Enter a valid phone number.')
export const minLength = (n) => (v) =>
  (v ?? '').length >= n ? '' : `Must be at least ${n} characters.`
export const positiveNumber = (v) => (Number(v) > 0 ? '' : 'Must be greater than 0.')
export const latitude = (v) =>
  v !== '' && Number(v) >= -90 && Number(v) <= 90 ? '' : 'Latitude must be between -90 and 90.'
export const longitude = (v) =>
  v !== '' && Number(v) >= -180 && Number(v) <= 180
    ? ''
    : 'Longitude must be between -180 and 180.'

// rules: { field: [validatorFn, ...] } -> { field: 'first error message' }
export const validate = (values, rules) => {
  const errors = {}
  for (const [field, fns] of Object.entries(rules)) {
    for (const fn of fns) {
      const msg = fn(values[field], values)
      if (msg) {
        errors[field] = msg
        break
      }
    }
  }
  return errors
}
