
export class ResourceTracker {
  private resources: Set<any> = new Set()

  track<T extends {dispose: () => void}>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  dispose() {
    this.resources.forEach((resource) => {
      resource.dispose()
      this.resources.delete(resource);
    })
    this.resources.clear();
  }
}
