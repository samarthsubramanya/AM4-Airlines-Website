"use client";
import AccountCircle from "@mui/icons-material/AccountCircleOutlined";
import DarkMode from "@mui/icons-material/DarkModeOutlined";
import LightMode from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Book" },
  { href: "/manage", label: "Manage booking" },
  { href: "/network", label: "Destinations" },
  { href: "/fleet", label: "Fleet" },
  { href: "/miles", label: "Mayur Miles" },
  { href: "/alliance", label: "Australia World" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { mode, systemMode, setMode } = useColorScheme();
  const [drawer, setDrawer] = useState(false);
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null);
  const dark = (mode === "system" ? systemMode : mode) === "dark";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: "divider", backdropFilter: "blur(12px)", bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.86)" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 60, md: 68 } }}>
          <IconButton edge="start" sx={{ display: { md: "none" } }} onClick={() => setDrawer(true)} aria-label="Open menu">
            <MenuIcon />
          </IconButton>
          <Link href="/" aria-label="Indian.com home" style={{ textDecoration: "none" }}>
            <Logo size={34} />
          </Link>
          <Box component="nav" sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, ml: 3, flexGrow: 1 }}>
            {NAV.map((n) => (
              <Button
                key={n.href}
                component={Link}
                href={n.href}
                color={active(n.href) ? "primary" : "inherit"}
                sx={{ fontWeight: active(n.href) ? 700 : 500, bgcolor: active(n.href) ? "action.selected" : undefined, px: 1.75 }}
              >
                {n.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
          <Tooltip title={dark ? "Light mode" : "Dark mode"}>
            <IconButton onClick={() => setMode(dark ? "light" : "dark")} aria-label="Toggle dark mode">
              {dark ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          {user ? (
            <>
              <IconButton onClick={(e) => setMenuEl(e.currentTarget)} aria-label="Account menu">
                <Avatar sx={{ width: 34, height: 34, bgcolor: "secondary.main", color: "secondary.contrastText", fontWeight: 700 }}>
                  {user.name.slice(0, 1).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={menuEl} open={!!menuEl} onClose={() => setMenuEl(null)}>
                <MenuItem disabled sx={{ opacity: "1 !important", flexDirection: "column", alignItems: "flex-start" }}>
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setMenuEl(null); router.push("/miles"); }}>My trips & miles</MenuItem>
                <MenuItem onClick={() => { setMenuEl(null); signOut(); }}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={Link} href={`/login?next=${encodeURIComponent(pathname)}`} variant="outlined" startIcon={<AccountCircle />}>
              Sign in
            </Button>
          )}
        </Toolbar>
      </Container>
      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation" onClick={() => setDrawer(false)}>
          <Logo size={32} />
          <List sx={{ mt: 2 }}>
            {NAV.map((n) => (
              <ListItemButton key={n.href} component={Link} href={n.href} selected={active(n.href)} sx={{ borderRadius: 3 }}>
                <ListItemText primary={n.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
