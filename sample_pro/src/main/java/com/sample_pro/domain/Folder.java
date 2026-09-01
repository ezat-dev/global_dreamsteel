package com.sample_pro.domain;

public class Folder {

    private int    id;
    private String name;
    private Integer parentId;   // NULL 허용

    public int     getId()       { return id; }
    public String  getName()     { return name; }
    public Integer getParentId() { return parentId; }

    public void setId(int id)             { this.id = id; }
    public void setName(String name)      { this.name = name; }
    public void setParentId(Integer pid)  { this.parentId = pid; }

    @Override
    public String toString() {
        return "Folder{id=" + id + ", name='" + name + "'}";
    }
}