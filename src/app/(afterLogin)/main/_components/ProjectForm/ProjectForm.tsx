"use client";

import classNames from "classnames/bind";
import { AlertCircle } from "lucide-react";
import React from "react";

import Input from "@/app/_components/Input/Input";
import Select from "@/app/_components/Select/Select";
import Textarea from "@/app/_components/Textarea/Textarea";
import { DATABASES } from "@/constants/database";
import { useProjectForm } from "@/hooks/projects/useProjectForm";

import styles from "./ProjectForm.module.css";
import ProjectFormFooter from "./ProjectFormFooter/ProjectFormFooter";
import ProjectFormHeader from "./ProjectFormHeader/ProjectFormHeader";

const cx = classNames.bind(styles);

export interface ProjectFormProps {
  onClose?: () => void;
}

export default function ProjectForm({ onClose }: ProjectFormProps) {
  const {
    formData,
    validationErrors,
    touched,
    isCreating,
    error,
    isFormValid,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    handleCancel,
  } = useProjectForm({
    onProjectCreated: () => {
      onClose?.();
    },
    onCancel: onClose,
  });

  return (
    <form className={cx("create-form")} onSubmit={handleSubmit}>
      <ProjectFormHeader />

      <div className={cx("form-fields")}>
        {/* Project Name */}
        <div className={cx("field-group")}>
          <Input
            id="project-name"
            type="text"
            label="Project Name"
            value={formData.project_name || ""}
            onChange={(e) => handleFieldChange("project_name", e.target.value)}
            onBlur={() => handleFieldBlur("project_name")}
            placeholder="Enter project name"
            disabled={isCreating}
            required
            error={touched.project_name && !!validationErrors.project_name}
            errorMessage={
              touched.project_name ? validationErrors.project_name : undefined
            }
          />
        </div>

        {/* Database Type */}
        <Select
          id="database-type"
          label="Database Type"
          value={formData.database_type || ""}
          options={DATABASES}
          onChange={(value) => handleFieldChange("database_type", value)}
          onBlur={() => handleFieldBlur("database_type")}
          disabled={isCreating}
          required
          error={touched.database_type && !!validationErrors.database_type}
          errorMessage={
            touched.database_type ? validationErrors.database_type : undefined
          }
        />

        {/* Description */}
        <div className={cx("field-group")}>
          <Textarea
            id="description"
            label="Description"
            value={formData.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            onBlur={() => handleFieldBlur("description")}
            placeholder="Optional project description"
            rows={3}
            disabled={isCreating}
            error={touched.description && !!validationErrors.description}
            errorMessage={
              touched.description ? validationErrors.description : undefined
            }
          />
        </div>
      </div>

      {/* API Error Display */}
      {error && (
        <div className={cx("api-error")}>
          <AlertCircle size={16} />
          <span>{error.message || "An error occurred"}</span>
        </div>
      )}

      <ProjectFormFooter
        isCreating={isCreating}
        isFormValid={isFormValid}
        onCancel={handleCancel}
      />
    </form>
  );
}
