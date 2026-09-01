package com.sample_pro.dao.monitor;

import com.sample_pro.domain.Folder;
import com.sample_pro.domain.Tag;
import java.util.List;

public interface TagDao {

    // 폴더
    List<Folder> selectFolderList();
    void insertFolder(Folder folder);      // ← 추가
    void deleteFolder(int folderId);       // ← 추가
    void deleteTagsByFolderId(int folderId); // ← 추가

    // 태그
    List<Tag> selectTagList(int folderId);
    void insertTag(Tag tag);
    void updateTag(Tag tag);
    void deleteTag(int id);
}