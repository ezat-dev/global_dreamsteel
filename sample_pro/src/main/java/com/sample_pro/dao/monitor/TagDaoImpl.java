package com.sample_pro.dao.monitor;

import java.util.List;

import javax.annotation.Resource;

import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import com.sample_pro.domain.Folder;
import com.sample_pro.domain.Tag;

@Repository
public class TagDaoImpl implements TagDao {

    @Resource(name = "session")
    private SqlSession sqlSession;

    // 폴더

    @Override
    public List<Folder> selectFolderList() {
        return sqlSession.selectList("TagMapper.selectFolderList");
    }

    @Override
    public void insertFolder(Folder folder) {
        sqlSession.insert("TagMapper.insertFolder", folder);
    }

    @Override
    public void deleteFolder(int folderId) {
        sqlSession.delete("TagMapper.deleteFolder", folderId);
    }

    @Override
    public void deleteTagsByFolderId(int folderId) {
        sqlSession.delete("TagMapper.deleteTagsByFolderId", folderId);
    }

    // 태그

    @Override
    public List<Tag> selectTagList(int folderId) {
        return sqlSession.selectList("TagMapper.selectTagList", folderId);
    }

    @Override
    public void insertTag(Tag tag) {
        sqlSession.insert("TagMapper.insertTag", tag);
    }

    @Override
    public void updateTag(Tag tag) {
        sqlSession.update("TagMapper.updateTag", tag);
    }

    @Override
    public void deleteTag(int id) {
        sqlSession.delete("TagMapper.deleteTag", id);
    }
}