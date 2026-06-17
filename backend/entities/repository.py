from abc import ABC, abstractmethod


class EntityDefinitionRepository(ABC):
    @abstractmethod
    def create_definition(self, record: dict) -> dict: ...

    @abstractmethod
    def find_definition_by_id(self, definition_id: str) -> dict | None: ...

    @abstractmethod
    def find_definition_by_slug(self, project_id: str, slug: str) -> dict | None: ...

    @abstractmethod
    def list_definitions(self, project_id: str | None = None) -> list[dict]: ...

    @abstractmethod
    def update_definition(self, definition_id: str, fields: dict) -> dict: ...

    @abstractmethod
    def delete_definition(self, definition_id: str) -> None: ...

    @abstractmethod
    def count_instances_for_definition(self, definition_id: str) -> int: ...


class EntityInstanceRepository(ABC):
    @abstractmethod
    def create_instance(self, record: dict) -> dict: ...

    @abstractmethod
    def find_instance_by_id(self, instance_id: str) -> dict | None: ...

    @abstractmethod
    def list_instances(
        self,
        definition_id: str | None = None,
        project_id: str | None = None,
        status: str | None = None,
    ) -> list[dict]: ...

    @abstractmethod
    def update_instance(self, instance_id: str, fields: dict) -> dict: ...

    @abstractmethod
    def delete_instance(self, instance_id: str) -> None: ...
