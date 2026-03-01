from app.main import app

# For Vercel, the entry point is typically 'app'
# Since app is already defined in app.main, we just export it here for convention.
handler = app
