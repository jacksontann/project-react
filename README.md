# Lumen

Login and registration pages for Lumen Residences, a made-up apartment building in Kuala Lumpur. Built with React and TypeScript using Create React App.

**Live demo:** https://project-react-jackson-tan.vercel.app/

| Sign in                                     | Register                                        |
| ------------------------------------------- | ----------------------------------------------- |
| ![Sign in page](docs/screenshots/login.png) | ![Register page](docs/screenshots/register.png) |

## Running it

```bash
yarn install
yarn start
```

The app runs on http://localhost:3333.

You can sign in with the demo account `demo@lumen.my` / `Lumen-Demo-2026!`, or register a new one.

## How it works

- A 3D building sits behind the forms. While you register, it gets built floor by floor as you fill in the form, and the window of your unit lights up. You can also click a window to pick your unit.
- When you sign in, your window lights up and the camera moves to it. Signing out turns the lights off.
- There's no backend. A mock API runs in the browser with Mock Service Worker and keeps accounts in localStorage. Passwords are hashed before they're saved.
- Passwords need at least 8 characters and a decent strength score. They're also checked against known data breaches with the Have I Been Pwned API, which only ever receives the first 5 characters of the password's hash.
- After 5 wrong passwords, signing in is locked for 30 seconds.

## Tech

React 19, TypeScript, Create React App, Tailwind CSS, React Router, React Hook Form with Zod, Three.js with React Three Fiber, Framer Motion and Mock Service Worker. Tests use Jest, Testing Library and Playwright.

## Scripts

- `yarn start` runs the app on port 3333
- `yarn build` makes a production build
- `yarn test` runs the tests

## Project structure

```
src/
  pages/        sign in, register and home pages
  features/     auth forms and logic, the 3D scene, the custom cursor
  components/   shared UI and layout
  mocks/        the mock API
```
