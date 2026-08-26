/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        card: "rgba(18, 24, 38, 0.7)",
        border: "rgba(255, 255, 255, 0.08)",
        cyan: {
          400: "#00e5ff",
          500: "#00b4d8",
        },
      },
    },
  },
  plugins: [],
};
