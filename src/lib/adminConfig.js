// NOT real authentication — there's no backend to verify a password against,
// so this is just a casual gate to keep the admin page from being obvious to
// stumble onto. Anyone who reads the site's JS bundle can see this value.
// Change it to whatever you like before you deploy.
export const ADMIN_PASSCODE = "pendown123";
