package com.sample_pro.service.monitor;

import com.sample_pro.domain.Folder;
import com.sample_pro.domain.Tag;
import java.util.List;

public interface TagService {

    // 폴더
    List<Folder> getFolderList();
    void insertFolder(Folder folder);
    void deleteFolder(int folderId);

    // 태그
    List<Tag> getTagList(int folderId);
    void insertTag(Tag tag);
    void updateTag(Tag tag);
    void deleteTag(int id);
}