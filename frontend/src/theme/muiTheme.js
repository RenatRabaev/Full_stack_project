/* ערכת MUI: RTL, צבעים כמו דף הנחיתה, טיפוגרפיה Heebo */
import { createTheme } from "@mui/material/styles";
import { heIL } from "@mui/material/locale";

export function createAppTheme() {
  return createTheme(
    {
      direction: "rtl",
      shape: {
        borderRadius: 12,
      },
      palette: {
        mode: "light",
        primary: { main: "#5b5bd6", dark: "#4848c4", light: "#7c7ce0" },
        secondary: { main: "#0d9488", dark: "#0f766e", light: "#14b8a6" },
        background: {
          default: "transparent",
          paper: "rgba(255, 255, 255, 0.82)",
        },
        text: {
          primary: "#0f172a",
          secondary: "#64748b",
        },
        divider: "rgba(15, 23, 42, 0.08)",
      },
      typography: {
        fontFamily: '"Heebo", "Segoe UI", system-ui, sans-serif',
        h5: { fontWeight: 700, letterSpacing: "-0.02em" },
        h6: { fontWeight: 700, letterSpacing: "-0.02em" },
      },
      components: {
        MuiButton: {
          defaultProps: { variant: "contained" },
          styleOverrides: {
            root: {
              borderRadius: 12,
              textTransform: "none",
              fontWeight: 600,
              paddingInline: 20,
              boxShadow: "0 4px 14px rgba(91, 91, 214, 0.25)",
              transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease",
              "&:hover": {
                boxShadow: "0 8px 22px rgba(91, 91, 214, 0.32)",
                transform: "translateY(-1px)",
              },
            },
            text: { boxShadow: "none", "&:hover": { transform: "none" } },
            outlined: { boxShadow: "none", "&:hover": { transform: "translateY(-1px)" } },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255, 255, 255, 0.65)",
              boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)",
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            },
            outlined: {
              borderColor: "rgba(15, 23, 42, 0.08)",
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: "rgba(255, 255, 255, 0.72)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
              boxShadow: "0 4px 24px rgba(15, 23, 42, 0.04)",
            },
            colorInherit: { color: "#0f172a" },
          },
        },
        MuiTextField: {
          defaultProps: { variant: "outlined" },
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.65)",
                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(91, 91, 214, 0.35)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#5b5bd6",
                  borderWidth: 2,
                },
              },
            },
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            body: { backgroundColor: "transparent" },
          },
        },
      },
    },
    heIL
  );
}
