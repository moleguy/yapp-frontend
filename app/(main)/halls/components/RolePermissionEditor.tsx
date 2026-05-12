"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RolePermissionsData,
  UpdateRolePermissionsReq,
  PermissionCategory,
} from "@/lib/api";

interface RolePermissionEditorProps {
  permissions: RolePermissionsData | null;
  onSave: (updates: UpdateRolePermissionsReq) => Promise<void>;
  loading: boolean;
  isOwner: boolean;
}

function cloneCategories(cats: PermissionCategory[]): PermissionCategory[] {
  return cats.map((c) => ({
    ...c,
    permissions: c.permissions.map((p) => ({ ...p })),
  }));
}

export default function RolePermissionEditor({
  permissions,
  onSave,
  loading,
  isOwner,
}: RolePermissionEditorProps) {
  const [local, setLocal] = useState<PermissionCategory[]>([]);
  const [originalFlat, setOriginalFlat] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (permissions) {
      setLocal(cloneCategories(permissions.categories));
      const o: Record<string, boolean> = {};
      for (const c of permissions.categories) {
        for (const p of c.permissions) {
          o[p.key] = p.is_enabled;
        }
      }
      setOriginalFlat(o);
    }
  }, [permissions]);

  const flatLocal = useMemo(() => {
    const o: Record<string, boolean> = {};
    for (const c of local) {
      for (const p of c.permissions) {
        o[p.key] = p.is_enabled;
      }
    }
    return o;
  }, [local]);

  const hasChanges = useMemo(() => {
    if (!permissions) return false;
    return Object.keys(flatLocal).some((k) => flatLocal[k] !== originalFlat[k]);
  }, [flatLocal, originalFlat, permissions]);

  const toggle = (catIndex: number, permIndex: number) => {
    if (!isOwner || permissions?.is_admin) return;
    setLocal((prev) => {
      const next = cloneCategories(prev);
      next[catIndex].permissions[permIndex].is_enabled =
        !next[catIndex].permissions[permIndex].is_enabled;
      return next;
    });
  };

  const handleSave = async () => {
    const updates: UpdateRolePermissionsReq = {};
    for (const key of Object.keys(flatLocal)) {
      if (flatLocal[key] !== originalFlat[key]) {
        (updates as Record<string, boolean>)[key] = flatLocal[key];
      }
    }
    await onSave(updates);
  };

  if (!permissions) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a role to view and edit its permissions.
      </div>
    );
  }

  const readOnly = !isOwner || permissions.is_admin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-[#1e1e1e]">{permissions.role_name}</h3>
          {permissions.is_admin && (
            <p className="text-xs text-amber-700 mt-1">
              Administrator roles have all permissions enabled.
            </p>
          )}
        </div>
        {hasChanges && !readOnly && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLocal(cloneCategories(permissions.categories));
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {local.map((category, ci) => (
          <div key={`${category.name}-${ci}`} className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">{category.name}</h4>
              <p className="text-xs text-gray-500">{category.description}</p>
            </div>
            <div className="space-y-2">
              {category.permissions.map((perm, pi) => (
                <div
                  key={perm.key}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#1e1e1e]">{perm.name}</div>
                    <div className="text-xs text-gray-500">{perm.description}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={perm.is_enabled}
                      onChange={() => toggle(ci, pi)}
                      disabled={readOnly}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
