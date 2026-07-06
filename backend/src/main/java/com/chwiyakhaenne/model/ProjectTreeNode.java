package com.chwiyakhaenne.model;

import java.util.ArrayList;
import java.util.List;

public class ProjectTreeNode {

    private String name;
    private String path;
    private String type;
    private boolean vulnerable;
    private SeverityCount severityCount = SeverityCount.empty();
    private final List<ProjectTreeNode> children = new ArrayList<>();

    public ProjectTreeNode(String name, String path, String type) {
        this.name = name;
        this.path = path;
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public String getPath() {
        return path;
    }

    public String getType() {
        return type;
    }

    public boolean isVulnerable() {
        return vulnerable;
    }

    public void setVulnerable(boolean vulnerable) {
        this.vulnerable = vulnerable;
    }

    public SeverityCount getSeverityCount() {
        return severityCount;
    }

    public void setSeverityCount(SeverityCount severityCount) {
        this.severityCount = severityCount;
    }

    public List<ProjectTreeNode> getChildren() {
        return children;
    }

    public ProjectTreeNode child(String childName, String childPath, String childType) {
        return children.stream()
                .filter(child -> child.name.equals(childName))
                .findFirst()
                .orElseGet(() -> {
                    ProjectTreeNode node = new ProjectTreeNode(childName, childPath, childType);
                    children.add(node);
                    return node;
                });
    }
}
