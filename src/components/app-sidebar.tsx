"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { BarChart3, Building2, CircleDollarSign, LogOut, Radar, Sparkles, Users } from "lucide-react";
import { DotBackdrop } from "@/components/kit/dot-backdrop";
import { ShinyText } from "@/components/kit/shiny-text";
import { isSupabaseBrowserConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV = [
  { href: "/", label: "Road to AGI", icon: Sparkles },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/benchmarks", label: "Benchmarks", icon: BarChart3 },
  { href: "/finance", label: "Finance", icon: CircleDollarSign },
  { href: "/networking", label: "Networking", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    if (isSupabaseBrowserConfigured()) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <DotBackdrop />
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
            <span aria-hidden className="radar-sweep absolute inset-0" />
            <Radar className="relative size-4" />
          </span>
          <ShinyText className="font-heading text-lg font-semibold tracking-tight">
            Frontier Radar
          </ShinyText>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Radar</SidebarGroupLabel>
          <SidebarGroupContent>
            <MotionConfig reducedMotion="user">
              <SidebarMenu>
                {NAV.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      {active && (
                        <motion.span
                          aria-hidden
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-md bg-sidebar-accent"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <SidebarMenuButton
                        isActive={active}
                        className="relative data-active:bg-transparent! [&>svg]:transition-transform [&>svg]:duration-200 hover:[&>svg]:scale-110 motion-reduce:[&>svg]:transition-none motion-reduce:hover:[&>svg]:scale-100"
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </MotionConfig>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
