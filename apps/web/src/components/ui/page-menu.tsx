"use client";

import { useEffect, useState } from "react";
import { MenuContainer, Menu, MenuItem, MenuIconTrigger } from "@wine-club/ui";
import { MoreHorizontal, Moon, Sun } from "geist-icons";

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  return { dark, toggle };
}

export function PageMenu() {
  const { dark, toggle } = useTheme();

  return (
    <MenuContainer>
      <MenuIconTrigger label="Page options">
        <MoreHorizontal className="h-4 w-4" />
      </MenuIconTrigger>
      <Menu width={192} align="end">
        <MenuItem
          onClick={toggle}
          prefix={dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        >
          {dark ? "Light mode" : "Dark mode"}
        </MenuItem>
      </Menu>
    </MenuContainer>
  );
}
