import Guide from "../models/Guide.js";


export const getAllGuides = async (req, res) => {
  try {
    const filters = {};
    
    // Apply category filter if provided
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    // First get featured guides
    const featuredGuides = await Guide.find({ ...filters, featured: true })
      .sort({ createdAt: -1 });
    
    // Then get other guides
    const regularGuides = await Guide.find({ ...filters, featured: false })
      .sort({ createdAt: -1 });
    
    // Combine the results
    const guides = [...featuredGuides, ...regularGuides];
    
    res.json({
      success: true,
      count: guides.length,
      data: guides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getGuideById = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    res.json({
      success: true,
      data: guide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin-only controllers (for creating/updating guides)
export const createGuide = async (req, res) => {
  try {

    // Check if user is admin (implement your admin check here)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to perform this action'
    //   });
    // }
    
    const { title, description, category, content, imageUrl, featured } = req.body;
    
    // Create new guide
    const guide = new Guide({
      title,
      description,
      category,
      content,
      imageUrl,
      featured: featured || false
    });
    
    await guide.save();
    
    res.status(201).json({
      success: true,
      data: guide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateGuide = async (req, res) => {
  try {
    // Check if user is admin (implement your admin check here)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to perform this action'
    //   });
    // }
    
    const updates = req.body;
    
    const guide = await Guide.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    res.json({
      success: true,
      data: guide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteGuide = async (req, res) => {
  try {
    // Check if user is admin (implement your admin check here)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    
    const guide = await Guide.findByIdAndDelete(req.params.id);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};