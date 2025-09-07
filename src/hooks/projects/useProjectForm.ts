import { useCallback, useState } from "react";

import { DEFAULT_DATABASE } from "@/constants/database";
import { useCreateProject } from "@/hooks/projects/useCreateProject";
import { ProjectData, ProjectRequest } from "@/types/project";
import {
  createInitialFormData,
  projectValidators,
} from "@/utils/project/projectValid";

export interface UseProjectFormOptions {
  onProjectCreated?: (project: ProjectData) => void;
  onCancel?: () => void;
}

// 초기 폼 데이터
const INITIAL_FORM_DATA = createInitialFormData(DEFAULT_DATABASE);

export function useProjectForm({
  onProjectCreated,
  onCancel,
}: UseProjectFormOptions) {
  const {
    mutateAsync: createProject,
    isPending: isCreating,
    error,
    reset: resetMutation,
  } = useCreateProject();

  const [formData, setFormData] = useState<ProjectRequest>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 폼 유효성 체크
  const isFormValid =
    !Object.values(validationErrors).some((error) => error) &&
    !!formData.project_name?.trim() &&
    !!formData.database_type;

  // 폼 초기화
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setValidationErrors({});
    setTouched({});
    resetMutation();
  }, [resetMutation]);

  // 필드 값 변경 핸들러
  const handleFieldChange = useCallback(
    (field: keyof ProjectRequest, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // 값이 변경되면 해당 필드의 에러 클리어
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
      }

      // API 에러가 있으면 클리어
      if (error) {
        resetMutation();
      }
    },
    [validationErrors, error, resetMutation]
  );

  // 필드 블러 핸들러 (포커스 아웃 시 검증)
  const handleFieldBlur = useCallback(
    (field: keyof ProjectRequest) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const validator = projectValidators[field];
      if (validator) {
        const error = validator(formData[field]);
        setValidationErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [formData]
  );

  // 폼 제출 핸들러
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 모든 필드를 touched로 표시
      const allTouched = Object.keys(INITIAL_FORM_DATA).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // 모든 필드 검증
      const errors: Record<string, string> = {};
      Object.keys(projectValidators).forEach((field) => {
        const key = field as keyof ProjectRequest;
        const validator = projectValidators[key];
        if (validator) {
          const error = validator(formData[key]);
          if (error) {
            errors[key] = error;
          }
        }
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      try {
        const project = await createProject({ data: formData });
        resetForm();
        onProjectCreated?.(project);
      } catch (err) {
        console.error("프로젝트 생성 실패:", err);
      }
    },
    [formData, createProject, resetForm, onProjectCreated]
  );

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    resetForm();
    onCancel?.();
  }, [resetForm, onCancel]);

  return {
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
    resetForm,
  };
}
