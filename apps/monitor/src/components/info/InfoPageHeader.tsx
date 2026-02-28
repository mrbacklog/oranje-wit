"use client";

import { useState } from "react";
import { PageHeader, InfoDrawer } from "@oranje-wit/ui";

interface InfoPageHeaderProps {
  title: string;
  subtitle: string;
  infoTitle: string;
  children: React.ReactNode;
}

export function InfoPageHeader({ title, subtitle, infoTitle, children }: InfoPageHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} onInfoClick={() => setOpen(true)} />
      <InfoDrawer open={open} onClose={() => setOpen(false)} title={infoTitle}>
        {children}
      </InfoDrawer>
    </>
  );
}
