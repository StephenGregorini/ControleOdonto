import React from "react";
import { Outlet } from "react-router-dom";
import { DashboardProvider } from "./DashboardContext";
import Layout from "./Layout";

export default function DashboardLayout() {
  return (
    <DashboardProvider>
      <Layout>
        <Outlet />
      </Layout>
    </DashboardProvider>
  );
}
