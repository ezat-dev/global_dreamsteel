package com.sample_pro.service.monitor;

import com.sample_pro.dao.monitor.TagDao;
import com.sample_pro.domain.Folder;
import com.sample_pro.domain.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service("tagService")
public class TagServiceImpl implements TagService {

    @Autowired
    private TagDao tagDao;

    // 폴더

    @Override
    public List<Folder> getFolderList() {
        return tagDao.selectFolderList();
    }

    @Override
    @Transactional
    public void insertFolder(Folder folder) {
        tagDao.insertFolder(folder);
    }

    @Override
    @Transactional
    public void deleteFolder(int folderId) {
        tagDao.deleteTagsByFolderId(folderId);  // 태그 먼저
        tagDao.deleteFolder(folderId);          // 폴더 삭제
    }

    // 태그

    @Override
    public List<Tag> getTagList(int folderId) {
        return tagDao.selectTagList(folderId);
    }

    @Override
    @Transactional
    public void insertTag(Tag tag) {
        tagDao.insertTag(tag);
    }

    @Override
    @Transactional
    public void updateTag(Tag tag) {
        tagDao.updateTag(tag);
    }

    @Override
    @Transactional
    public void deleteTag(int id) {
        tagDao.deleteTag(id);
    }
}